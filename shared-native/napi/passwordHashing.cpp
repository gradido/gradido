// AI-GENERATED — not an architecture reference
#include "passwordHashing.h"

#include "arnm/mono_timer.h"

#include <sodium.h>

#include <algorithm>
#include <cstring>

namespace gradido::password {

    namespace {
        uint64_t readUint64LittleEndian(const unsigned char* bytes)
        {
            uint64_t value = 0;
            for (int i = 7; i >= 0; --i) {
                value = (value << 8) | bytes[i];
            }
            return value;
        }
    } // namespace

    bool deriveKey(uint64_t& out, const std::string& salt, const std::string& password, const Secrets& secrets, const Difficulty& difficulty)
    {
        crypto_hash_sha512_state state;
        crypto_hash_sha512_init(&state);
        crypto_hash_sha512_update(&state, reinterpret_cast<const unsigned char*>(salt.data()), salt.size());
        crypto_hash_sha512_update(&state, secrets.appSecret.data(), secrets.appSecret.size());
        unsigned char hash[crypto_hash_sha512_BYTES];
        crypto_hash_sha512_final(&state, hash);
        static_assert(crypto_pwhash_SALTBYTES <= crypto_hash_sha512_BYTES, "the argon2id salt is the start of the sha512 hash");

        unsigned char encryptionKey[crypto_box_SEEDBYTES];
        int result = crypto_pwhash(
            encryptionKey,
            sizeof(encryptionKey),
            password.data(),
            password.size(),
            hash,
            difficulty.opsLimit,
            difficulty.memLimit,
            crypto_pwhash_ALG_ARGON2ID13
        );
        if (result != 0) {
            return false;
        }

        unsigned char shortHash[crypto_shorthash_BYTES];
        crypto_shorthash(shortHash, encryptionKey, sizeof(encryptionKey), secrets.serverKey.data());
        sodium_memzero(encryptionKey, sizeof(encryptionKey));
        out = readUint64LittleEndian(shortHash);
        return true;
    }

    uint64_t derivePinKey(const std::string& salt, const std::string& pin, const Secrets& secrets)
    {
        unsigned char hash[crypto_generichash_BYTES];
        crypto_generichash_state state;
        crypto_generichash_init(&state, secrets.serverKey.data(), secrets.serverKey.size(), sizeof(hash));
        crypto_generichash_update(&state, (const unsigned char*)salt.data(), salt.size());
        crypto_generichash_update(&state, secrets.appSecret.data(), secrets.appSecret.size());
        crypto_generichash_update(&state, (const unsigned char*)pin.data(), pin.size());
                
        crypto_generichash_final(&state, hash, sizeof hash);
        return readUint64LittleEndian(hash);
    }

    // ---------------------------------------------------------------------------------------
    // HashingPool

    size_t HashingPool::defaultThreadCount()
    {
        // 0 where the hardware cannot be asked
        return std::max<size_t>(1, std::thread::hardware_concurrency() / 2);
    }

    HashingPool::HashingPool(Napi::Env env, Secrets secrets, Difficulty difficulty, size_t threadCount, double maxExpectedWaitMs)
        : mSecrets(std::move(secrets)),
          mDifficulty(difficulty),
          mThreadCount(threadCount),
          mMaxExpectedWaitMs(maxExpectedWaitMs),
          mDurationCount(0),
          mDurationNext(0),
          mHighPicksInARow(0),
          mStopping(false),
          mEnv(env),
          // an unbounded queue: what reaches it is bounded by the admission rule in front of it
          mThreadSafeFunction(ThreadSafeFunction::New(env, "gradido.passwordHashing", 0, 1, this)),
          mPending(0),
          mCleanupHookRan(false)
    {
        // One derivation, so the admission rule has a figure for this hardware before the
        // first job; the inputs do not matter, only the cost.
        arnm_mono_timer timer;
        arnm_mono_timer_reset(&timer);
        uint64_t unused;
        deriveKey(unused, "calibration", "calibration", mSecrets, mDifficulty);
        recordDurationLocked(arnm_mono_timer_millis(timer));

        // nothing pending yet, so the loop may exit without this pool
        mThreadSafeFunction.Unref(env);
        // Runs before the environment tears the thread-safe function down: cleanup hooks run
        // in reverse order of registration and the function registered its own first.
        mCleanupHook = env.AddCleanupHook(&HashingPool::cleanupHook, static_cast<void*>(this));
        mThreads.reserve(threadCount);
        for (size_t i = 0; i < threadCount; ++i) {
            mThreads.emplace_back(&HashingPool::workerLoop, this);
        }
    }

    HashingPool::~HashingPool()
    {
        shutdown();
        if (!mCleanupHookRan && !mCleanupHook.IsEmpty()) {
            mCleanupHook.Remove(mEnv);
        }
        sodium_memzero(mSecrets.appSecret.data(), mSecrets.appSecret.size());
        sodium_memzero(mSecrets.serverKey.data(), mSecrets.serverKey.size());
    }

    void HashingPool::cleanupHook(void* pool)
    {
        auto* self = static_cast<HashingPool*>(pool);
        self->mCleanupHookRan = true;
        self->shutdown();
    }

    HashingPool::Admission HashingPool::enqueue(Napi::Env env, Priority priority, std::string salt, std::string password, Napi::Promise::Deferred deferred)
    {
        Admission admission;
        {
            std::lock_guard<std::mutex> lock(mMutex);
            admission.expectedWaitMs = expectedWaitMsLocked();
            admission.admitted = admission.expectedWaitMs < mMaxExpectedWaitMs;
            if (admission.admitted) {
                auto* job = new Job{ std::move(salt), std::move(password), deferred, 0, false };
                (priority == Priority::HIGH ? mHighPriorityQueue : mLowPriorityQueue).push_back(job);
            }
        }
        if (!admission.admitted) {
            return admission;
        }
        bool wasIdle = mPending == 0;
        mPending += 1;
        if (wasIdle) {
            // keeps the loop alive until the answer is in
            mThreadSafeFunction.Ref(env);
        }
        mCondition.notify_one();
        return admission;
    }

    HashingPool::Stats HashingPool::stats()
    {
        std::lock_guard<std::mutex> lock(mMutex);
        return Stats{
            mThreadCount,
            mMaxExpectedWaitMs,
            averageDurationMsLocked(),
            expectedWaitMsLocked(),
            mHighPriorityQueue.size(),
            mLowPriorityQueue.size(),
        };
    }

    void HashingPool::recordDurationLocked(double durationMs)
    {
        mDurationsMs[mDurationNext] = durationMs;
        mDurationNext = (mDurationNext + 1) % DURATION_WINDOW;
        mDurationCount = std::min(mDurationCount + 1, DURATION_WINDOW);
    }

    double HashingPool::averageDurationMsLocked() const
    {
        double sum = 0;
        for (size_t i = 0; i < mDurationCount; ++i) {
            sum += mDurationsMs[i];
        }
        // never 0: the constructor records one before anything else
        return sum / static_cast<double>(mDurationCount);
    }

    // What a job queued now would wait by the rule: everything queued ahead of it, served at
    // the average duration, spread over the threads.
    double HashingPool::expectedWaitMsLocked() const
    {
        double queued = static_cast<double>(mHighPriorityQueue.size() + mLowPriorityQueue.size());
        return queued * averageDurationMsLocked() / static_cast<double>(mThreadCount);
    }

    HashingPool::Job* HashingPool::takeJobLocked()
    {
        bool takeLow;
        if (mHighPriorityQueue.empty()) {
            takeLow = true;
        } else if (mLowPriorityQueue.empty()) {
            takeLow = false;
        } else {
            // both wait: the low queue gets every pick after HIGH_PICKS_BEFORE_LOW high ones
            takeLow = mHighPicksInARow >= HIGH_PICKS_BEFORE_LOW;
        }
        std::deque<Job*>& queue = takeLow ? mLowPriorityQueue : mHighPriorityQueue;
        mHighPicksInARow = takeLow ? 0 : mHighPicksInARow + 1;
        Job* job = queue.front();
        queue.pop_front();
        return job;
    }

    void HashingPool::workerLoop()
    {
        for (;;) {
            Job* job = nullptr;
            {
                std::unique_lock<std::mutex> lock(mMutex);
                mCondition.wait(lock, [this] { return mStopping || !mHighPriorityQueue.empty() || !mLowPriorityQueue.empty(); });
                if (mStopping) {
                    return;
                }
                job = takeJobLocked();
            }
            arnm_mono_timer timer;
            arnm_mono_timer_reset(&timer);
            job->derived = deriveKey(job->key, job->salt, job->password, mSecrets, mDifficulty);
            double durationMs = arnm_mono_timer_millis(timer);
            sodium_memzero(job->password.data(), job->password.size());
            {
                std::lock_guard<std::mutex> lock(mMutex);
                recordDurationLocked(durationMs);
            }
            // napi_closing only once the function is released, which happens after the
            // threads are joined -- so this cannot fail while a thread runs
            if (mThreadSafeFunction.NonBlockingCall(job) != napi_ok) {
                delete job;
            }
        }
    }

    void HashingPool::CallJs(Napi::Env env, Napi::Function, HashingPool* pool, Job* job)
    {
        if (env == nullptr) {
            // the environment is going down with this answer still in the queue
            delete job;
            return;
        }
        if (job->derived) {
            job->deferred.Resolve(Napi::BigInt::New(env, job->key));
        } else {
            job->deferred.Reject(Napi::Error::New(env, "[hashPassword] crypto_pwhash failed, most likely out of memory").Value());
        }
        delete job;
        pool->answered(env);
    }

    void HashingPool::answered(Napi::Env env)
    {
        mPending -= 1;
        if (mPending == 0) {
            // nothing left to wait for: the loop may exit without this pool again
            mThreadSafeFunction.Unref(env);
        }
    }

    void HashingPool::shutdown()
    {
        {
            std::lock_guard<std::mutex> lock(mMutex);
            if (mStopping) {
                return;
            }
            mStopping = true;
        }
        mCondition.notify_all();
        for (std::thread& thread : mThreads) {
            thread.join();
        }
        mThreads.clear();
        // Never answered: their promises stay pending, which only happens while the
        // environment goes away or the context is destroyed on purpose.
        for (std::deque<Job*>* queue : { &mHighPriorityQueue, &mLowPriorityQueue }) {
            for (Job* job : *queue) {
                delete job;
            }
            queue->clear();
        }
        mThreadSafeFunction.Release();
    }

} // namespace gradido::password
