
extern crate iota_client;
extern crate tokio;
use iota_client::{Client, Result};

use std::convert::TryInto;
use std::ptr;

use futures::executor::block_on;
use tokio::task;
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
) -> bool {
    let message_slice = unsafe { std::slice::from_raw_parts(message, message_size) };
    let index_name_slice = unsafe {std::slice::from_raw_parts(index_name, index_size) };

  /*  let join_handle: task::JoinHandle<_> = task::spawn_blocking(move|| {
        // some blocking work here
        send_message(message_slice, index_name_slice);
    });
    block_on(join_handle);
    return true;
    */

    //let result = tokio::task::spawn_blocking(send_message(message_slice, index_name_slice));
    //let result = send_message(message_slice, index_name_slice).await;
  /*  let result = send_message(message_slice, index_name_slice);
    match result {
        Ok(_) => true,
        Err(_) => false
    }
//  */  

  /*  let future = async move {
        println!("*** future starting!!");
        let res = send_message(message_slice, index_name_slice).await;
        println!(" future finished!! ***");
    };
    */
    let res = tokio::runtime::Builder::new_multi_thread()//new_current_thread()
            .worker_threads(1)
            .enable_all()
            .build()
            .unwrap()
            .block_on(send_message(message_slice, index_name_slice));

    match res {
        Ok(_) => true,
        Err(_) => false
    }
  // */
    
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