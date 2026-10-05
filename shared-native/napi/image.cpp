// AI-GENERATED — not an architecture reference
#include "image.h"

#include <napi.h>

#ifdef HAVE_RUST_IMAGE_FFI

#include "rust_image_ffi.h"

#include <cmath>
#include <cstdint>
#include <cstring>
#include <new>
#include <string>
#include <vector>

namespace gradido::image {

    namespace {
        // largest integer a JS number holds exactly
        const double MAX_SAFE_INTEGER = 9007199254740991.0;

        const char* const OPTION_NAMES[] = {
            "maxOutputBytes", "inputFormats", "outputFormat", "maxWidth", "maxHeight", "maxPixels",
            "maxAllocBytes", "jpegQuality", "jpegQualityFromInput", "jpegSubsampling", "applyOrientation",
            "background",
        };

        void throwTypeError(Napi::Env env, const std::string& message) {
            Napi::TypeError::New(env, "[reencodeImage] " + message).ThrowAsJavaScriptException();
        }

        // 0 if name is no format
        uint32_t formatFromString(const std::string& name) {
            if (name == "jpeg") return RIMG_FORMAT_JPEG;
            if (name == "png") return RIMG_FORMAT_PNG;
            if (name == "webp") return RIMG_FORMAT_WEBP;
            return 0;
        }

        const char* formatToString(uint32_t format) {
            switch (format) {
                case RIMG_FORMAT_JPEG: return "jpeg";
                case RIMG_FORMAT_PNG: return "png";
                case RIMG_FORMAT_WEBP: return "webp";
                default: return "unknown";
            }
        }

        // nullptr for a status that is not an expected failure of a picture
        const char* expectedFailureName(int32_t status) {
            switch (status) {
                case RIMG_ERR_BUFFER_TOO_SMALL: return "RIMG_ERR_BUFFER_TOO_SMALL";
                case RIMG_ERR_NO_MEMORY: return "RIMG_ERR_NO_MEMORY";
                case RIMG_ERR_UNSUPPORTED: return "RIMG_ERR_UNSUPPORTED";
                case RIMG_ERR_DECODE: return "RIMG_ERR_DECODE";
                case RIMG_ERR_LIMIT: return "RIMG_ERR_LIMIT";
                case RIMG_ERR_ENCODE: return "RIMG_ERR_ENCODE";
                case RIMG_ERR_PANIC: return "RIMG_ERR_PANIC";
                default: return nullptr;
            }
        }

        // a typo in a limit's name would otherwise silently leave the default in place
        bool checkOptionNames(Napi::Env env, Napi::Object options) {
            Napi::Array names = options.GetPropertyNames();
            for (uint32_t i = 0; i < names.Length(); i++) {
                std::string name = names.Get(i).ToString().Utf8Value();
                bool known = false;
                for (const char* optionName : OPTION_NAMES) {
                    known = known || name == optionName;
                }
                if (!known) {
                    throwTypeError(env, "Unknown option: " + name);
                    return false;
                }
            }
            return true;
        }

        // integer option in [min, max]; out is left alone if the option is undefined
        // return false if a JS exception was thrown
        bool getIntegerOption(Napi::Env env, Napi::Object options, const char* name, double min, double max, uint64_t& out) {
            Napi::Value value = options.Get(name);
            if (value.IsUndefined()) {
                return true;
            }
            double number = value.IsNumber() ? value.As<Napi::Number>().DoubleValue() : NAN;
            if (!(number >= min && number <= max) || std::floor(number) != number) {
                throwTypeError(env, std::string("Expected options.") + name + " to be an integer between "
                    + std::to_string((uint64_t)min) + " and " + std::to_string((uint64_t)max));
                return false;
            }
            out = (uint64_t)number;
            return true;
        }

        bool getFormatOptions(Napi::Env env, Napi::Object options, rimg_options& opt) {
            Napi::Value inputFormats = options.Get("inputFormats");
            if (!inputFormats.IsUndefined()) {
                if (!inputFormats.IsArray() || inputFormats.As<Napi::Array>().Length() == 0) {
                    throwTypeError(env, "Expected options.inputFormats to be a non-empty array of 'jpeg', 'png', 'webp'");
                    return false;
                }
                Napi::Array formats = inputFormats.As<Napi::Array>();
                opt.input_formats = 0;
                for (uint32_t i = 0; i < formats.Length(); i++) {
                    Napi::Value entry = formats.Get(i);
                    uint32_t format = entry.IsString() ? formatFromString(entry.As<Napi::String>().Utf8Value()) : 0;
                    if (format == 0) {
                        throwTypeError(env, "Expected options.inputFormats to be a non-empty array of 'jpeg', 'png', 'webp'");
                        return false;
                    }
                    opt.input_formats |= format;
                }
            }
            Napi::Value outputFormat = options.Get("outputFormat");
            if (!outputFormat.IsUndefined()) {
                uint32_t format = outputFormat.IsString() ? formatFromString(outputFormat.As<Napi::String>().Utf8Value()) : 0;
                if (format != RIMG_FORMAT_JPEG && format != RIMG_FORMAT_PNG) {
                    throwTypeError(env, "Expected options.outputFormat to be 'jpeg' or 'png'");
                    return false;
                }
                opt.output_format = format;
            }
            return true;
        }

        bool getBackgroundOption(Napi::Env env, Napi::Object options, rimg_options& opt) {
            Napi::Value background = options.Get("background");
            if (background.IsUndefined()) {
                return true;
            }
            if (!background.IsArray() || background.As<Napi::Array>().Length() != 3) {
                throwTypeError(env, "Expected options.background to be [red, green, blue], each 0 to 255");
                return false;
            }
            Napi::Array channels = background.As<Napi::Array>();
            for (uint32_t i = 0; i < 3; i++) {
                Napi::Value channel = channels.Get(i);
                double number = channel.IsNumber() ? channel.As<Napi::Number>().DoubleValue() : NAN;
                if (!(number >= 0 && number <= 255) || std::floor(number) != number) {
                    throwTypeError(env, "Expected options.background to be [red, green, blue], each 0 to 255");
                    return false;
                }
                opt.background[i] = (uint8_t)number;
            }
            return true;
        }

        // out is left alone if the option is undefined
        // return false if a JS exception was thrown
        bool getBooleanOption(Napi::Env env, Napi::Object options, const char* name, uint8_t& out) {
            Napi::Value value = options.Get(name);
            if (value.IsUndefined()) {
                return true;
            }
            if (!value.IsBoolean()) {
                throwTypeError(env, std::string("Expected options.") + name + " to be a boolean");
                return false;
            }
            out = value.As<Napi::Boolean>().Value() ? 1 : 0;
            return true;
        }

        // return false if a JS exception was thrown
        bool getOptions(Napi::Env env, Napi::Object options, rimg_options& opt, size_t& maxOutputBytes) {
            if (!checkOptionNames(env, options)) {
                return false;
            }
            uint64_t outputBytes = 0;
            if (!getIntegerOption(env, options, "maxOutputBytes", 1, (double)UINT32_MAX, outputBytes)) {
                return false;
            }
            if (outputBytes == 0) {
                throwTypeError(env, "Expected options.maxOutputBytes, the byte budget of the result");
                return false;
            }
            maxOutputBytes = (size_t)outputBytes;

            uint64_t maxWidth = opt.max_width;
            uint64_t maxHeight = opt.max_height;
            uint64_t jpegQuality = opt.jpeg_quality;
            if (!getIntegerOption(env, options, "maxWidth", 0, (double)UINT32_MAX, maxWidth)
                || !getIntegerOption(env, options, "maxHeight", 0, (double)UINT32_MAX, maxHeight)
                || !getIntegerOption(env, options, "maxPixels", 0, MAX_SAFE_INTEGER, opt.max_pixels)
                || !getIntegerOption(env, options, "maxAllocBytes", 0, MAX_SAFE_INTEGER, opt.max_alloc_bytes)
                || !getIntegerOption(env, options, "jpegQuality", 1, 100, jpegQuality)) {
                return false;
            }
            opt.max_width = (uint32_t)maxWidth;
            opt.max_height = (uint32_t)maxHeight;
            opt.jpeg_quality = (uint8_t)jpegQuality;

            if (!getBooleanOption(env, options, "applyOrientation", opt.apply_orientation)
                || !getBooleanOption(env, options, "jpegSubsampling", opt.jpeg_subsampling)
                || !getBooleanOption(env, options, "jpegQualityFromInput", opt.jpeg_quality_from_input)) {
                return false;
            }
            return getFormatOptions(env, options, opt) && getBackgroundOption(env, options, opt);
        }

        // What a picture of this size takes encoded, capped at the budget. Not a bound: noise as
        // PNG, or as JPEG at quality 100 without subsampling, takes slightly more, and the
        // caller then asks again.
        size_t estimatedOutputBytes(const rimg_info& info, size_t maxOutputBytes) {
            const uint64_t HEADER_BYTES = 1024;
            uint64_t estimate = (uint64_t)info.width * info.height * 4 + HEADER_BYTES;
            return estimate < maxOutputBytes ? (size_t)estimate : maxOutputBytes;
        }

        Napi::Object failure(Napi::Env env, const char* name, int32_t status) {
            Napi::Object error = Napi::Object::New(env);
            error.Set("name", Napi::String::New(env, name));
            error.Set("message", Napi::String::New(env, rimg_status_string(status)));
            Napi::Object result = Napi::Object::New(env);
            result.Set("success", Napi::Boolean::New(env, false));
            result.Set("error", error);
            return result;
        }

        // decoding and encoding is CPU work for the length of the call, so it leaves the event loop
        class ReencodeWorker : public Napi::AsyncWorker {
        public:
            ReencodeWorker(Napi::Env env, const uint8_t* input, size_t inputLength, const rimg_options& opt, size_t maxOutputBytes)
                : Napi::AsyncWorker(env),
                  mDeferred(Napi::Promise::Deferred::New(env)),
                  // a copy: the caller is free to change or drop its buffer while the worker runs
                  mInput(input, input + inputLength),
                  mOptions(opt),
                  mMaxOutputBytes(maxOutputBytes),
                  mOutputLength(0),
                  mStatus(RIMG_ERR_INVALID_ARGUMENT)
            {
                std::memset(&mInfo, 0, sizeof(mInfo));
            }

            Napi::Promise Promise() const { return mDeferred.Promise(); }

        protected:
            void Execute() override {
                // an empty vector's data() may be NULL, which is an invalid argument rather than no picture
                static const uint8_t empty = 0;
                const uint8_t* input = mInput.empty() ? &empty : mInput.data();

                // The budget is the most the result may take, not what it will take: the buffer is
                // sized by what the header says, and only up to the budget.
                size_t capacity = 0;
                rimg_info probed;
                if (rimg_probe(input, mInput.size(), &probed) == RIMG_OK) {
                    capacity = estimatedOutputBytes(probed, mMaxOutputBytes);
                }
                // no memory for the output is the same answer as no memory for the pixels
                try {
                    mOutput.resize(capacity);
                    mStatus = rimg_reencode(&mOptions, input, mInput.size(), mOutput.data(), mOutput.size(), &mOutputLength, &mInfo);
                    // The estimate was too low and the budget is not: once more, with what it needs.
                    if (mStatus == RIMG_ERR_BUFFER_TOO_SMALL && mOutputLength <= mMaxOutputBytes) {
                        mOutput.resize(mOutputLength);
                        mStatus = rimg_reencode(&mOptions, input, mInput.size(), mOutput.data(), mOutput.size(), &mOutputLength, &mInfo);
                    }
                } catch (const std::bad_alloc&) {
                    mStatus = RIMG_ERR_NO_MEMORY;
                }
            }

            void OnOK() override {
                Napi::Env env = Env();
                Napi::Object result = Napi::Object::New(env);
                if (mStatus == RIMG_OK) {
                    Napi::Object value = Napi::Object::New(env);
                    value.Set("data", Napi::Buffer<uint8_t>::Copy(env, mOutput.data(), mOutputLength));
                    value.Set("inputFormat", Napi::String::New(env, formatToString(mInfo.input_format)));
                    value.Set("width", Napi::Number::New(env, mInfo.width));
                    value.Set("height", Napi::Number::New(env, mInfo.height));
                    value.Set("hasAlpha", Napi::Boolean::New(env, mInfo.has_alpha != 0));
                    value.Set("inputJpegQuality", Napi::Number::New(env, mInfo.input_jpeg_quality));
                    result.Set("success", Napi::Boolean::New(env, true));
                    result.Set("value", value);
                    mDeferred.Resolve(result);
                    return;
                }
                const char* name = expectedFailureName(mStatus);
                if (!name) {
                    // the options were checked before, so this is a bug in this binding
                    std::string message = "[reencodeImage] rimg_reencode: ";
                    message += rimg_status_string(mStatus);
                    mDeferred.Reject(Napi::Error::New(env, message).Value());
                    return;
                }
                result = failure(env, name, mStatus);
                if (mStatus == RIMG_ERR_BUFFER_TOO_SMALL) {
                    Napi::Object error = result.Get("error").As<Napi::Object>();
                    error.Set("requiredBytes", Napi::Number::New(env, (double)mOutputLength));
                    error.Set("inputJpegQuality", Napi::Number::New(env, mInfo.input_jpeg_quality));
                }
                mDeferred.Resolve(result);
            }

            void OnError(const Napi::Error& error) override {
                mDeferred.Reject(error.Value());
            }

        private:
            Napi::Promise::Deferred mDeferred;
            std::vector<uint8_t> mInput;
            rimg_options mOptions;
            size_t mMaxOutputBytes;
            std::vector<uint8_t> mOutput;
            size_t mOutputLength;
            rimg_info mInfo;
            int32_t mStatus;
        };
    } // namespace

    bool CheckAbi(Napi::Env env)
    {
        if (rimg_abi_version() == RIMG_ABI_VERSION) {
            return true;
        }
        std::string message = "rust-image-ffi: the header is ABI version " + std::to_string(RIMG_ABI_VERSION)
            + ", the linked module " + std::to_string(rimg_abi_version());
        Napi::Error::New(env, message).ThrowAsJavaScriptException();
        return false;
    }

    Napi::Value Probe(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        if (info.Length() < 1 || !info[0].IsTypedArray() || info[0].As<Napi::TypedArray>().TypedArrayType() != napi_uint8_array) {
            Napi::TypeError::New(env, "[probeImage] Expected input to be a Uint8Array").ThrowAsJavaScriptException();
            return env.Null();
        }
        Napi::Uint8Array input = info[0].As<Napi::Uint8Array>();
        static const uint8_t empty = 0;
        rimg_info probed;
        std::memset(&probed, 0, sizeof(probed));
        int32_t status = rimg_probe(input.ByteLength() ? input.Data() : &empty, input.ByteLength(), &probed);
        if (status != RIMG_OK) {
            const char* name = expectedFailureName(status);
            if (!name) {
                std::string message = "[probeImage] rimg_probe: ";
                message += rimg_status_string(status);
                Napi::Error::New(env, message).ThrowAsJavaScriptException();
                return env.Null();
            }
            return failure(env, name, status);
        }
        Napi::Object value = Napi::Object::New(env);
        value.Set("format", Napi::String::New(env, formatToString(probed.input_format)));
        value.Set("width", Napi::Number::New(env, probed.width));
        value.Set("height", Napi::Number::New(env, probed.height));
        value.Set("hasAlpha", Napi::Boolean::New(env, probed.has_alpha != 0));
        value.Set("inputJpegQuality", Napi::Number::New(env, probed.input_jpeg_quality));
        Napi::Object result = Napi::Object::New(env);
        result.Set("success", Napi::Boolean::New(env, true));
        result.Set("value", value);
        return result;
    }

    Napi::Value Reencode(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        if (info.Length() < 2) {
            throwTypeError(env, "Expected two arguments: input: Uint8Array, options: object");
            return env.Null();
        }
        if (!info[0].IsTypedArray() || info[0].As<Napi::TypedArray>().TypedArrayType() != napi_uint8_array) {
            throwTypeError(env, "Expected input to be a Uint8Array");
            return env.Null();
        }
        if (!info[1].IsObject() || info[1].IsArray()) {
            throwTypeError(env, "Expected options to be an object");
            return env.Null();
        }
        rimg_options opt;
        rimg_options_default(&opt);
        size_t maxOutputBytes = 0;
        if (!getOptions(env, info[1].As<Napi::Object>(), opt, maxOutputBytes)) {
            return env.Null();
        }

        Napi::Uint8Array input = info[0].As<Napi::Uint8Array>();
        ReencodeWorker* worker = nullptr;
        // the worker copies the input; node-addon-api turns only a Napi::Error into a JS exception,
        // anything else leaving this function would end the process
        try {
            worker = new ReencodeWorker(env, input.Data(), input.ByteLength(), opt, maxOutputBytes);
        } catch (const std::bad_alloc&) {
            Napi::Error::New(env, "[reencodeImage] Out of memory copying the input").ThrowAsJavaScriptException();
            return env.Null();
        }
        Napi::Promise promise = worker->Promise();
        // the worker deletes itself when it is done
        worker->Queue();
        return promise;
    }

} // namespace gradido::image

#else

namespace gradido::image {

    bool CheckAbi(Napi::Env)
    {
        return true;
    }

    Napi::Value Probe(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        Napi::Error::New(env, "[probeImage] Not available: rust-image-ffi has no prebuild for this platform").ThrowAsJavaScriptException();
        return env.Null();
    }

    Napi::Value Reencode(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        Napi::Error::New(env, "[reencodeImage] Not available: rust-image-ffi has no prebuild for this platform").ThrowAsJavaScriptException();
        return env.Null();
    }

} // namespace gradido::image

#endif
