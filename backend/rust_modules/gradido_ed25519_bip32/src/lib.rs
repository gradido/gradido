
//extern crate libc;
// https://docs.rs/ed25519-bip32/
extern crate ed25519_bip32;
extern crate core;

use std::convert::TryInto;
use std::ptr;
use std::fmt;

/*
use std::ffi::{CStr,CString};

#[no_mangle]
pub extern "C" fn derivePublicKey(public_key: *const libc::c_char, chain_code: *const libc::c_char, index: i32) -> *const libc::c_char {
    let public_key_u = unsafe { CStr::from_ptr(public_key) };
    let public_key_str = public_key_u.to_str().unwrap();

    /*let parsed_url = Url::parse(
        str1
    ).unwrap();
*/
    CString::new("derivePublic").unwrap().into_raw()
}

#[no_mangle]
pub extern fn derivePrivateKey(public_key: *const libc::c_char, chain_code: *const libc::c_char, index: i32) -> *const libc::c_char {
    CString::new("derivePrivate").unwrap().into_raw()
}
*/

#[no_mangle]
pub extern fn helloWorld()
{
    println!("Hallo Welt");
}

#[no_mangle]
pub extern fn getPublicFromPrivateKey(private_key: *const u8, chain_code: *const u8, public_key: *mut u8) -> bool {

    let private_key_slice = unsafe { std::slice::from_raw_parts(private_key, 32) };
    let priv_key_array: &[u8; 32] = &(&private_key_slice[..]).try_into().unwrap();

    let chain_code_slice = unsafe { std::slice::from_raw_parts(chain_code, 32) };
    let chain_code_array: &[u8; 32] = &(&chain_code_slice[..]).try_into().unwrap();

    let privKey = ed25519_bip32::XPrv::from_nonextended_force(priv_key_array, chain_code_array);
//    println!("privkey: {:#04X?}", privKey.extended_secret_key());
    //println!("chain_code: {:#04X?}", privKey.chain_code());
 
    let pubKey = privKey.public();
    let public_key_slice = pubKey.public_key_slice();
    //println!("pubkey: {:#04X?}", pubKey.public_key());
    let public_key_ptr: *const u8 = public_key_slice.as_ptr() as *const u8;
    
    std::mem::forget(public_key);
    unsafe { ptr::copy(public_key_slice.as_ptr(),  public_key, 32); }
    
    return true;
}

#[no_mangle]
pub extern fn is_3rd_highest_bit_clear(private_key: *const u8, chain_code: *const u8) -> bool 
{
    let private_key_slice = unsafe { std::slice::from_raw_parts(private_key, 32) };
    let priv_key_array: &[u8; 32] = &(&private_key_slice[..]).try_into().unwrap();

    let chain_code_slice = unsafe { std::slice::from_raw_parts(chain_code, 32) };
    let chain_code_array: &[u8; 32] = &(&chain_code_slice[..]).try_into().unwrap();

    let result = ed25519_bip32::XPrv::from_nonextended_noforce(priv_key_array, chain_code_array);
    match result {
        Ok(privKey) => return true,
        Err(e) => return false,
    }
}
