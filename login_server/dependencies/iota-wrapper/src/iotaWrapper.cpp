#include <stdio.h>
#include <stdlib.h>
#include "iotaWrapper.h"
#include "client/api/v1/send_message.h"

#include <exception>

iota_client_conf_t gIota_Config;

int Iota_sendMessage(const char* message, const char* indexName, unsigned char* messageId) 
{
  int err = 0;
  
  res_send_message_t res = {};

/*  printf("Iota host: %s\n", gIota_Config.host);
  printf("index: %s\n", indexName);
  printf("message: %s\n", message);
  */

  // send out index
  printf("before call to send_indexation_msg\n");
  try {
    err = send_indexation_msg(&gIota_Config, "GRADIDO.gdd1", "Short Test Message", &res);
  } catch(std::exception &ex) {
    printf("exception: %s\n", ex.what());
  }
  printf("after call to send_indexation_msg\n");

  if (res.is_error) {
    printf("Err response: %s (code: %s)\n", res.u.error->msg, res.u.error->code);
    res_err_free(res.u.error);
  }

  if (err) {
    return -1;
  } else {
    memcpy(messageId, res.u.msg_id, 32);
  }
  return 0;
}

void Iota_setConfig(const char* host, int port)
{
    //gIota_Config.host = host;
    strcpy(gIota_Config.host, host);
    printf("Iota host: %s\n", gIota_Config.host);
    gIota_Config.port = port;
    if(port == 443) {
        gIota_Config.use_tls = true;
    } else {
        gIota_Config.use_tls = false;
    }
}