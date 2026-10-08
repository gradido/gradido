// AI-GENERATED — not an architecture reference
#pragma once

#include <napi.h>

#include <condition_variable>
#include <cstddef>
#include <cstdint>
#include <deque>
#include <mutex>
#include <string>
#include <thread>
#include <vector>

namespace gradido::password {

    /**
     * The secrets every derivation in this namespace is keyed with. Handed in once, when the
     * app context is created, and never read from the environment here.
     */
    struct Secrets {
        std::vector<uint8_t> appSecret;
        // crypto_shorthash_KEYBYTES (16) bytes, checked where the context is created
        std::vector<uint8_t> serverKey;
    };

    /**
     * ⛔ argon2id cost of the password derivation. These are NOT tuning parameters: every
     * hash in users.password was derived with exactly these, and a hash derived with other
     * values matches no stored password. They can be lowered for tests only, where no hash
     * is ever compared with a production one. The production values are not kept here: they
     * are handed in, from DEFAULT_PASSWORD_HASHING in shared's AppContext.
     */
    struct Difficulty {
        unsigned long long opsLimit;
        size_t memLimit;
    };

    // Which queue a password hash waits in. The TypeScript side mirrors this in
    // shared/src/enum/PasswordHashPriority.ts, by value.
    enum class Priority : uint32_t {
        HIGH = 0, // the login: it is what the member is waiting for
        LOW = 1,  // everything else: setting or changing a password
    };

    /**
     * The password derivation, byte for byte what backend/src/password/EncryptionWorker.js
     * did: sha512(salt + appSecret) cut to crypto_pwhash_SALTBYTES as the argon2id salt,
     * crypto_pwhash to crypto_box_SEEDBYTES, crypto_shorthash of that keyed with the server
     * key, read as a little-endian uint64 -- the shape users.password stores.
     *
     * @return false only when libsodium refused, which for valid limits means it could not
     *   get the memory
     */
    bool deriveKey(uint64_t& out, const std::string& salt, const std::string& password, const Secrets& secrets, const Difficulty& difficulty);

    /**
     * The thank-you-card PIN derivation, byte for byte what backend/src/password/PinEncryptor.ts
     * did: keyed BLAKE2b (crypto_generichash) over salt + appSecret + pin, keyed with the
     * server key, cut to the first 8 bytes as a little-endian uint64.
     *
     * ⛔ Load-bearing, like the password derivation: a value derived differently matches no
     * stored PIN, and there is no way to tell that apart from a wrong PIN.
     */
    uint64_t derivePinKey(const std::string& salt, const std::string& pin, const Secrets& secrets);

    /**
     * A fixed number of threads that derive password keys, fed from two queues.
     *
     * Admission is by time, not by a number of places -- a number would be right for one
     * server and wrong for the next. The pool keeps the duration of its last derivations
     * (DURATION_WINDOW of them, measured on this hardware) and admits a job only while what
     * is queued already would be served within maxExpectedWaitMs (handed in, the production
     * value is PASSWORD_HASH_MAX_EXPECTED_WAIT_MS in shared/src/const): queued jobs times the
     * average duration, spread over the threads. A job over that is refused at once, so the
     * server answers "try again later" instead of piling up logins it cannot serve. The first
     * figure comes from one derivation run at start, so the rule holds from the first login.
     *
     * The threads prefer the high priority queue, but not absolutely: while both queues wait,
     * every pick after HIGH_PICKS_BEFORE_LOW high ones goes to the low queue, so a run of
     * logins cannot starve the password changes.
     *
     * Jobs are handed in on the main thread and answered there too, through a thread-safe
     * function: the worker threads never touch JavaScript. The thread-safe function is only
     * referenced while a job is pending, so an idle pool does not keep the event loop alive.
     */
    class HashingPool {
    public:
        static constexpr size_t DURATION_WINDOW = 5;
        // while both queues wait: this many high picks, then one low
        static constexpr size_t HIGH_PICKS_BEFORE_LOW = 2;

        struct Stats {
            size_t threadCount;
            double maxExpectedWaitMs;
            // over the last DURATION_WINDOW derivations
            double averageDurationMs;
            // what a job queued now would wait by the rule, before its own derivation
            double expectedWaitMs;
            size_t highPriorityQueued;
            size_t lowPriorityQueued;
        };
        struct Admission {
            bool admitted;
            // what the job would have waited, by the rule above; filled in either way
            double expectedWaitMs;
        };

        // half the logical cores, at least one
        static size_t defaultThreadCount();

        // main thread; threadCount >= 1. Runs one derivation to calibrate, so it takes as
        // long as one -- at the production difficulty around a tenth of a second.
        // maxExpectedWaitMs in whole milliseconds: finer than that decides nothing
        HashingPool(Napi::Env env, Secrets secrets, Difficulty difficulty, size_t threadCount, size_t maxExpectedWaitMs);
        ~HashingPool();
        HashingPool(const HashingPool&) = delete;
        HashingPool& operator=(const HashingPool&) = delete;

        /**
         * main thread. Resolves deferred with the key as a BigInt, or rejects it when libsodium
         * could not derive one. deferred is untouched when the job is not admitted.
         */
        Admission enqueue(Napi::Env env, Priority priority, std::string salt, std::string password, Napi::Promise::Deferred deferred);

        Stats stats();
        bool isRunning() const { return !mStopping; }

        /**
         * main thread, idempotent. Finishes the jobs the threads are on, drops every job not
         * yet answered -- queued or just finished -- unanswered, joins the threads and aborts
         * the thread-safe function, so no answer reaches JavaScript after this. Runs from the
         * env cleanup hook, so it comes before the function is torn down with the environment.
         */
        void shutdown();

    private:
        /**
         * Owned by one thread at a time, never shared: the main thread fills it and queues it
         * under mMutex, a worker takes it out under mMutex and writes key and derived, then
         * hands it to the thread-safe function, whose own lock brings it back to the main
         * thread. Each handover is a mutex release/acquire pair, so no field needs to be atomic.
         */
        struct Job {
            std::string salt;
            std::string password;
            Napi::Promise::Deferred deferred;
            uint64_t key;
            bool derived;
        };
        static void CallJs(Napi::Env env, Napi::Function callback, HashingPool* pool, Job* job);
        using ThreadSafeFunction = Napi::TypedThreadSafeFunction<HashingPool, Job, CallJs>;

        static void cleanupHook(void* pool);
        void workerLoop();
        // mMutex held
        Job* takeJobLocked();
        void recordDurationLocked(double durationMs);
        double averageDurationMsLocked() const;
        double expectedWaitMsLocked() const;
        // main thread: one answer has arrived
        void answered(Napi::Env env);

        Secrets mSecrets;
        const Difficulty mDifficulty;
        const size_t mThreadCount;
        const size_t mMaxExpectedWaitMs;

        std::mutex mMutex;
        std::condition_variable mCondition;
        std::deque<Job*> mHighPriorityQueue;
        std::deque<Job*> mLowPriorityQueue;
        // the last DURATION_WINDOW derivation durations, a ring; mDurationCount caps at the window
        double mDurationsMs[DURATION_WINDOW];
        size_t mDurationCount;
        size_t mDurationNext;
        size_t mHighPicksInARow;
        bool mStopping;
        std::vector<std::thread> mThreads;

        napi_env mEnv;
        ThreadSafeFunction mThreadSafeFunction;
        // main thread only: jobs handed in and not yet answered. The thread-safe function is
        // referenced while this is above zero.
        size_t mPending;
        Napi::Env::CleanupHook<void (*)(void*), void> mCleanupHook;
        bool mCleanupHookRan;
    };

} // namespace gradido::password
