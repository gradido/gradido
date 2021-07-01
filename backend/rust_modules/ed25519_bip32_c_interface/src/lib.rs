
// https://docs.rs/ed25519-bip32/
// https://docs.rs/cryptoxide/
extern crate ed25519_bip32;
extern crate core;

use std::convert::TryInto;
use std::ptr;

// ***************  helper functions ************************************

pub fn c_pointer_to_rust_array(c_pointer: *const u8) -> &'static[u8; 32]
{
    let slice = unsafe { std::slice::from_raw_parts(c_pointer, 32) };
    return (&slice[..]).try_into().unwrap();
}

pub fn c_pointer_to_rust_array_64(c_pointer: *const u8) -> &'static[u8; 64]
{
    let slice = unsafe { std::slice::from_raw_parts(c_pointer, 64) };
    return (&slice[..]).try_into().unwrap();
}

pub fn copy_rust_to_c(slice: &[u8], c_pointer: *mut u8, size: usize)
{
    std::mem::forget(c_pointer);
    unsafe { ptr::copy(slice.as_ptr(), c_pointer, size); }
}

// ****************** exported functions **********************************

#[no_mangle]
pub extern fn getPublicFromPrivateKey(private_key: *const u8, chain_code: *const u8, public_key: *mut u8) 
{
    let priv_key = ed25519_bip32::XPrv::from_nonextended_force(
        c_pointer_to_rust_array(private_key),
        c_pointer_to_rust_array(chain_code)
    );

    copy_rust_to_c(priv_key.public().public_key_slice(), public_key, 32);
}

#[no_mangle]
pub extern fn getPrivateExtended(
    private_key: *const u8, 
    chain_code: *const u8, 
    priv_key_extended: *mut u8,
    public_key: *mut u8
)
{
    let priv_key = ed25519_bip32::XPrv::from_nonextended_force(
        c_pointer_to_rust_array(private_key),
        c_pointer_to_rust_array(chain_code)
    );
    copy_rust_to_c(priv_key.extended_secret_key_slice(), priv_key_extended, 64);
    copy_rust_to_c(priv_key.public().public_key_slice(), public_key, 32);
}


#[no_mangle]
pub extern fn is_3rd_highest_bit_clear(private_key: *const u8, chain_code: *const u8) -> bool 
{
    let result = ed25519_bip32::XPrv::from_nonextended_noforce(
        c_pointer_to_rust_array(private_key), 
        c_pointer_to_rust_array(chain_code)
    );
    match result {
        Ok(_) => return true,
        Err(_) => return false,
    }
}

#[no_mangle]
pub extern fn derivePublicKey(
    public_key: *const u8,
    chain_code: *const u8,
    index: u32, 
    derived_pub_key: *mut u8,
    derived_chain_code: *mut u8
) -> bool {

    let pub_key = ed25519_bip32::XPub::from_pk_and_chaincode(
        c_pointer_to_rust_array(public_key),
        c_pointer_to_rust_array(chain_code)
    );
    match pub_key.derive(ed25519_bip32::DerivationScheme::V2, index) {
        Ok(child_key) => {
            copy_rust_to_c(child_key.public_key_slice(), derived_pub_key, 32);
            copy_rust_to_c(child_key.chain_code_slice(), derived_chain_code, 32);
            return true;
        },
        Err(_) => {
            /*match err {
                ed25519_bip32::DerivationError::InvalidAddition => println!("Invalid Addition"),
                ed25519_bip32::DerivationError::ExpectedSoftDerivation => println!("Expected Soft Derivation")
            }*/
            return false;
        }
    }
}

#[no_mangle]
pub extern fn derivePrivateKey(
    private_key: *const u8,
    chain_code: *const u8,
    index: u32, 
    derived_ext_priv_key: *mut u8,
    derived_chain_code: *mut u8
) {

    let priv_key = ed25519_bip32::XPrv::from_nonextended_force(
        c_pointer_to_rust_array(private_key),
        c_pointer_to_rust_array(chain_code)
    );
    let child_key = priv_key.derive(ed25519_bip32::DerivationScheme::V2, index); 

    copy_rust_to_c(child_key.extended_secret_key_slice(), derived_ext_priv_key, 64);
    copy_rust_to_c(child_key.chain_code_slice(), derived_chain_code, 32);
}

#[no_mangle]
pub extern fn sign_extended(message: *const u8, message_size: usize, secret_key_extended: *const u8, sign: *mut u8)
{
    let message_slice = unsafe { std::slice::from_raw_parts(message, message_size) };

    let signature = cryptoxide::ed25519::signature_extended(
        (&message_slice[..]).try_into().unwrap(),
        c_pointer_to_rust_array_64(secret_key_extended)
    );
    copy_rust_to_c(&signature, sign, 64);
}