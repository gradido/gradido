
extern crate iota_client;
extern crate tokio;
use iota_client::{Client, Result};

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
pub extern fn sendIotaMessage(
    message: *const u8,
    message_size: usize, 
    index_name: *const u8,
    index_size: usize,
    message_id: *mut u8
) {
    let message_slice = unsafe { std::slice::from_raw_parts(message, message_size) };
    let index_name_slice = unsafe {std::slice::from_raw_parts(index_name, index_size) };
    
    let future = async move {
        println!("*** future starting!!");
        let res = send_message(message_slice, index_name_slice).await;
        
    };
    
    let res = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap()
            .block_on(future);
    
}

pub async fn send_message(message: &[u8], index: &[u8]) -> Result<()>
{
    let iota = Client::builder()
        .with_node("https://api.lb-0.testnet.chrysalis2.com")?
        // .with_permanode("http://18.196.167.57:8000/api/permanode/", None, None)?
        .finish()
        .await?;

    let message = iota
        .message()
        .with_index(index)
        .with_data(message.to_vec())
        .finish()
        .await?;

    println!(
        "Message sent https://explorer.iota.org/testnet/message/{}\n",
        message.id().0
    );
    //copy_rust_to_c(message.id().0, message_id, 32);

    println!("Message sent {}", message.id().0);
    Ok(())
}