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
     * is ever compared with a production one.
     */
    struct Difficulty {
        unsigned long long opsLimit;
        size_t memLimit;
    };
    constexpr Difficulty DEFAULT_DIFFICULTY = { 10, 33554432 /* 32 MiB */ };

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
     * A fixed number of threads that derive password keys, fed from two queues: every high
     * priority job goes before any low priority one. Each queue has a fixed number of places
     * and a job that finds its queue full is refused at once, so the server answers "try
     * again later" instead of piling up logins it cannot serve.
     *
     * Jobs are handed in on the main thread and answered there too, through a thread-safe
     * function: the worker threads never touch JavaScript. The thread-safe function is only
     * referenced while a job is pending, so an idle pool does not keep the event loop alive.
     */
    class HashingPool {
    public:
        struct Limits {
            size_t threadCount;
            size_t highPriorityCapacity;
            size_t lowPriorityCapacity;
        };
        static constexpr size_t HIGH_PRIORITY_PLACES_PER_THREAD = 25;
        static constexpr size_t LOW_PRIORITY_PLACES_PER_THREAD = 10;

        // half the logical cores, at least one
        static size_t defaultThreadCount();

        // main thread; threadCount >= 1
        HashingPool(Napi::Env env, Secrets secrets, Difficulty difficulty, size_t threadCount);
        ~HashingPool();
        HashingPool(const HashingPool&) = delete;
        HashingPool& operator=(const HashingPool&) = delete;

        /**
         * main thread. Resolves deferred with the key as a BigInt, or rejects it when libsodium
         * could not derive one.
         * @return false when the queue of that priority is full; deferred is then untouched
         */
        bool enqueue(Napi::Env env, Priority priority, std::string salt, std::string password, Napi::Promise::Deferred deferred);

        const Limits& limits() const { return mLimits; }
        bool isRunning() const { return !mStopping; }

        /**
         * main thread, idempotent. Finishes the jobs the threads are on, drops the queued
         * ones unanswered and joins the threads. Runs from the env cleanup hook, so it comes
         * before the thread-safe function is torn down with the environment.
         */
        void shutdown();

    private:
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
        // main thread: one answer has arrived
        void answered(Napi::Env env);

        Secrets mSecrets;
        const Difficulty mDifficulty;
        const Limits mLimits;

        std::mutex mMutex;
        std::condition_variable mCondition;
        std::deque<Job*> mHighPriorityQueue;
        std::deque<Job*> mLowPriorityQueue;
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
