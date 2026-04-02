#include <napi.h>
#include "../c/unit.h"

class GradidoUnit : public Napi::ObjectWrap<GradidoUnit> {
public:
    static Napi::FunctionReference constructor;
    static Napi::Object Init(Napi::Env env, Napi::Object exports);

    GradidoUnit(const Napi::CallbackInfo& info);
    ~GradidoUnit();

    // Methods
    Napi::Value ToString(const Napi::CallbackInfo& info);
    Napi::Value ToNumber(const Napi::CallbackInfo& info);    
    Napi::Value Negate(const Napi::CallbackInfo& info);
    Napi::Value Negated(const Napi::CallbackInfo& info);
    Napi::Value Add(const Napi::CallbackInfo& info);
    Napi::Value Plus(const Napi::CallbackInfo& info);
    Napi::Value Sub(const Napi::CallbackInfo& info);
    Napi::Value Minus(const Napi::CallbackInfo& info);
    Napi::Value Decay(const Napi::CallbackInfo& info);
    Napi::Value Decayed(const Napi::CallbackInfo& info);
    Napi::Value CompoundInterest(const Napi::CallbackInfo& info);
    Napi::Value CompoundInterested(const Napi::CallbackInfo& info);
    
    // Comparison methods
    Napi::Value Equal(const Napi::CallbackInfo& info);
    inline Napi::Value Eq(const Napi::CallbackInfo& info) { return Equal(info); }
    Napi::Value NotEqual(const Napi::CallbackInfo& info);
    inline Napi::Value Ne(const Napi::CallbackInfo& info) { return NotEqual(info); }
    Napi::Value GreaterThan(const Napi::CallbackInfo& info);
    inline Napi::Value Gt(const Napi::CallbackInfo& info) { return GreaterThan(info); }
    Napi::Value LessThan(const Napi::CallbackInfo& info);
    inline Napi::Value Lt(const Napi::CallbackInfo& info) { return LessThan(info); }
    Napi::Value GreaterOrEqual(const Napi::CallbackInfo& info);
    inline Napi::Value Gte(const Napi::CallbackInfo& info) { return GreaterOrEqual(info); }
    Napi::Value LessOrEqual(const Napi::CallbackInfo& info);
    inline Napi::Value Lte(const Napi::CallbackInfo& info) { return LessOrEqual(info); }
    
    // Static methods
    static Napi::Value SecondsBetween(const Napi::CallbackInfo& info);

private:
    grdd_unit mValue;
    
    // Helper methods
    Napi::Value CreateNewInstance(grdd_unit newValue) const;
};


