#pragma once

#include <napi.h>

namespace gradido {

    /**
     * What the addon keeps per env. An env has a single instance data slot, so every class
     * that needs its constructor later (to create instances from C++, or for InstanceOf)
     * keeps it here rather than in the slot itself. main.cpp sets it before the classes'
     * Init run; node-addon-api deletes it when the env goes away.
     */
    struct AddonData {
        Napi::FunctionReference ledgerAnchor;
        Napi::FunctionReference ed25519KeyPair;
        Napi::FunctionReference x25519KeyPair;
    };

} // namespace gradido
