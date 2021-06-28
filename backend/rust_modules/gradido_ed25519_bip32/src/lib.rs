
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
pub extern fn getPublicFromPrivateKey(private_key: *const u8, chain_code: *const u8, public_key: *mut u8) -> bool {
    println!("start function");
    let private_key_slice = unsafe { std::slice::from_raw_parts(private_key, 32) };
    let priv_key_array: &[u8; 32] = &(&private_key_slice[..]).try_into().unwrap();

    let chain_code_slice = unsafe { std::slice::from_raw_parts(chain_code, 32) };
    let chain_code_array: &[u8; 32] = &(&chain_code_slice[..]).try_into().unwrap();
    println!("call XPrv constructor");
    let privKey = ed25519_bip32::XPrv::from_nonextended_force(priv_key_array, chain_code_array);
 
    let pubKey = privKey.public();
    let public_key_slice = pubKey.public_key_slice();
    println!("pubkey: {:#04X?}", pubKey.public_key());
    let public_key_ptr: *const u8 = public_key_slice.as_ptr() as *const u8;

    // let public_key_dst_slice: &mut [u8] = core::slice::from_raw_parts_mut(public_key, 32 as usize);
    // let public_key_dst_array: &[u8; 32] = &(&public_key_dst_slice[..]).try_into().unwrap();
    // ptr::copy_nonoverlapping(public_key_slice, public_key, 32);
    unsafe { ptr::write(&mut *public_key, *public_key_ptr) };
    
    return true;
}
