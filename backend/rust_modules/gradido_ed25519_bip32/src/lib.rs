
extern crate libc;
extern crate ed25519_bip32;

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
pub extern "C" fn derivePrivateKey(public_key: *const libc::c_char, chain_code: *const libc::c_char, index: i32) -> *const libc::c_char {
    CString::new("derivePrivate").unwrap().into_raw()
}

#[no_mangle]
pub extern "C" fn getPublicFromPrivateKey(private_key: *const libc::c_char) -> *const libc::c_char {
    CString::new("publicFromPrivate").unwrap().into_raw()
}