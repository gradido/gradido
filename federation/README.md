# Federation

## Bun-Compatibility

### Known Issue: Bun's --minify breaks mysql2 compatibility

```
error: Received packet in the wrong sequence.
 fatal: true,
  code: "PROTOCOL_INCORRECT_PACKET_SEQUENCE"

```
This issue seems to be caused by bun aggressively optimizing or minifying binary operations in the mysql2 authentication layer (Buffer, crypto, xor, etc.), resulting in corrupted packet handling.