// AI-GENERATED — not an architecture reference
#include <napi.h>

namespace gradido::image {

    // The ABI of rust-image-ffi is not stable: whether the header this was compiled against and
    // the module it is linked with belong together. Throws and returns false if not.
    bool CheckAbi(Napi::Env env);
    // rimg_probe from rust-image-ffi: reads the header only
    Napi::Value Probe(const Napi::CallbackInfo& info);
    // rimg_reencode from rust-image-ffi on a worker thread, returns a Promise
    Napi::Value Reencode(const Napi::CallbackInfo& info);

} // namespace gradido::image
