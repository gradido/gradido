# Federation

This document describes how Gradido communities find each other and verify each other. Communities find each other through the DHT of HyperSwarm, see [@hyperswarm/dht](https://github.com/hyperswarm/dht).

Becoming acquainted with another community takes two stages:

1. **Federation:** the communities find each other in the DHT and tell each other their federation url.
2. **Verification:** each community asks the other at that url for its community infos and accepts only an answer signed with the key the DHT announced.

After that the communities talk to each other directly, every request and answer signed, see [Communication between communities](#communication-between-communities).

## Technical Architecture

Three modules of a community take part:

| Module | Part in the federation |
| --- | --- |
| *DHT-Node* (`dht-node`) | writes the home community, finds the other communities in the DHT, exchanges the federation url with them and verifies them |
| *Federation-Module* (`federation`) | answers the requests of other communities under `/peer-api/v1/…`, among them the signed community infos |
| *Backend* (`backend`) | sends the requests of its users to other communities, and lists the communities for the Admin-UI |

All of them use the `communities` table. Its rows of other communities (`foreign = 1`) are written by the DHT-Node only, and only after a correct answer: a community the admin sees has answered correctly at least once.

There is one federation-module per community. The peer api carries its version in the route (`/peer-api/v1/…`); a route the other side lacks answers 404.

### The communities table

The columns the federation uses:

| Column | Description |
| --- | --- |
| `foreign` | 0 for the home community, 1 for every other one |
| `url` | the federation url the community announces, `<FEDERATION_COMMUNITY_URL>/api/` |
| `public_key` | the Ed25519 key the community announces in the DHT and signs with; the private key (`private_key`) only for the home community |
| `community_uuid` | the uuid of the community, never changed as long as the community exists |
| `public_encryption_key` | the X25519 key requests to the community are encrypted with; the private key only for the home community |
| `public_jwt_key` | the key the community signs its JWTs with; the private key only for the home community |
| `name`, `description`, `hiero_topic_id`, `creation_date` | from the community infos |
| `authenticated_at` | when the community answered correctly the first time |
| `verified_at` | when the community answered correctly the last time |

### Configuration of the DHT-Node

| Key | Description |
| --- | --- |
| `FEDERATION_DHT_TOPIC` | the topic the communities of one network announce on and look up, `GRADIDO_HUB` |
| `FEDERATION_DHT_SEED` | 32 bytes as hex, the key pair of the home community is derived from it; it must not change once the community exists |
| `FEDERATION_COMMUNITY_URL` | the base url of this community, the federation url is `<FEDERATION_COMMUNITY_URL>/api/` |
| `COMMUNITY_NAME`, `COMMUNITY_DESCRIPTION` | name and description of the home community |

### Start of a community

On each start the DHT-Node writes the home community (`writeHomeCommunityEntry` in `dht-node/src/dht_node/index.ts`):

* without a home community it inserts one with a new uuid, the key pair of `FEDERATION_DHT_SEED`, a new JWT key pair and a new encryption key pair, and url, name and description of the configuration,
* an existing home community takes over url, name and description of the configuration; its uuid and keys stay. A seed whose key pair is not the one of the home community stops the start.

## Stage 1 - Federation

The DHT-Node of every community does the following, all the time:

1. It announces itself on the hash of `FEDERATION_DHT_TOPIC` with the key pair of the home community, every 30 seconds.
2. It looks up the other communities on the same topic, every 20 seconds, and connects to each one it finds. Over the connection it sends nothing but its federation url, `<FEDERATION_COMMUNITY_URL>/api/`, as ascii. A community is connected to again 2 minutes after it took the url (`SUCCESSTIME`), or 4 minutes after its connection failed (`ERRORTIME`), not more often, however many DHT nodes return it.
3. It accepts connections of other communities and takes the url they send. The connection of the DHT is encrypted with the Noise protocol, and `socket.remotePublicKey` is the key of the community on the other side: the url comes from the owner of that key.
4. It verifies the community right away, see stage 2. Nothing of the announcement is stored before that.

A community it has neither found nor heard from for 10 minutes (`FEDERATION_AUTHENTICATION_TIMEOUT_MS`) it forgets, together with its deadlines.

## Stage 2 - Verification of a community by its signed community infos

### What has to be proven

The DHT already proves one thing: the url a community sends over its socket comes from the owner of the announced key. What the DHT cannot prove is that the server answering at that url outside the DHT is the same community. This is the only thing left to verify: the server at the announced url holds the private key of the announced public key.

The identity of a community is its url, its public key and its uuid together. The first verified answer binds the three to each other (trust on first use, as SSH does with `known_hosts`); afterwards none of them can change without the others, see step 5 below.

The uuid is an identifier, not a secret. It is part of every user address, of transactions, contacts and e-mail links, and every user of a community sees it. It is therefore delivered openly with the signed community infos. Knowing a uuid must never be enough to act in the name of a community: a request from another community is accepted only as signed by that community's key, and the community it acts for is the one the signature belongs to, never a uuid named in its payload.

### Sequence

1. The DHT-Node (`validateCommunity` in `dht-node/src/dht_node/validateCommunity.ts`) receives the url a community sends over the DHT socket. It takes it only if it is ascii, at most 255 characters long and an http(s) url. In production the url must also be able to point to the internet (`publicHttpUrlSchema` in `shared/src/schema/federation.schema.ts`): no credentials, no name of this machine or the local network, no address of a special-purpose range such as loopback, private networks or link-local. It asks each community at most once per 2 minutes (`SUCCESSTIME`), however often the community connects, and a request still running counts as made.
2. It sends one request to the federation-module at the announced url:

   `GET https://<foreign.url>/peer-api/v1/communityInfos?exchangeId=<128 random bits as hex>`

   A community that has not answered completely within 5 seconds (`FEDERATION_REQUEST_TIMEOUT_MS`) is given up. It is asked again the first time it sends its url once 2 minutes (`SUCCESSTIME`) have passed since this request; a connection before that sends no new request. How a request reaches another community is described in [Requests to other communities](#requests-to-other-communities).
3. The federation-module of the foreign community answers with its community infos (uuid, name, description, creation date, public key, public JWT key, public encryption key, hiero topic id) and the `exchangeId` of the request, and signs the answer with the Ed25519 key of its home community as an HTTP Message Signature ([RFC 9421](https://www.rfc-editor.org/rfc/rfc9421)):
   * covered components: `@status`, `content-type`, `content-digest`, and of the request answered `@method;req` and `@path;req`
   * the body, and with it the `exchangeId`, is covered through `content-digest` (BLAKE2b-256, in the format of [RFC 9530](https://www.rfc-editor.org/rfc/rfc9530))
   * signature parameters: `keyid` (the public key as hex, the same key the DHT announces), `alg="ed25519"` and `created`

   Only an answer that passed the response schema is signed. A request without an `exchangeId` of exactly 32 hex characters, and an answer that does not fit the schema, get a 422 without signature. Error answers carry no signature and no data; the DHT-Node never takes community infos from them.
4. The DHT-Node accepts the answer only if
   * it carries exactly one signature, and that one names the **announced** public key as `keyid` and verifies against it, not against a key the answer names,
   * the `exchangeId` in the body is the one of its own request,
   * method and path are those of its own request,
   * the digest matches the body,
   * the public key in the community infos is the announced one,
   * the uuid is not the one of the own home community.

   Any other answer, and no answer within the timeout, writes nothing; the community is asked again only as step 1 allows, when it sends its url 2 minutes or more after the last request.
5. For an accepted answer:
   * a community not known by its uuid is inserted with `authenticated_at` and `verified_at` set: the signed answer is the authentication,
   * a known community gets `verified_at`; one whose name, description or hiero topic id changed is updated as well, only these three fields can change this way,
   * a known community answering with another public key, another url or another encryption key is not changed and not verified, the difference is logged. How an admin confirms a legitimate change of url or key is not designed yet; until then such a community keeps its stored url and keys,
   * the unique keys of `communities` (`uuid_key`, `public_key_key`, `url_key`) refuse a new community that claims the uuid, key or url of another one; the refusal is logged.

   A foreign community counts as reachable (`reachableCommunities`) while its `verified_at` is younger than `FEDERATION_AUTHENTICATION_TIMEOUT_MS` (10 minutes). A community that keeps announcing itself is verified again every 2 to 4 minutes.

### Why the answer can be trusted

The `exchangeId` makes an answer fresh: it answers this one request and no other, so a recorded answer cannot be replayed. Every signature also carries `created`, and it is accepted only for `FEDERATION_REQUEST_TIMEOUT_S` (5 seconds) after that, with 1 second of clock skew. The clocks of the community servers therefore have to run as exactly as possible: activating a time synchronization service is part of the server setup. Binding method and path keeps a signed answer of another route of the same community from passing as this one. Scheme, host and port are not covered, because a proxy in front of the federation-module changes them.

The `exchangeId` is the only part of the signed data the requesting side chooses. It is restricted to 32 hex characters and reaches the signature only through the digest of the JSON body, in a signature base built by RFC 9421, which always starts with `"@status":`. A requester therefore cannot make the community sign bytes of its choice, nor anything that could be mistaken for another format signed with the same key: the endpoint is no signing oracle.

The public JWT key and the public encryption key arrive inside the signed answer, so they are vouched for by the key the DHT announced.

The verification needs one request per community, sent as soon as the community announces itself. A community that does not answer holds up only its own request, for at most 5 seconds. Nothing is stored between request and answer, and the uuid arrives together with the signed infos before the community is inserted: `communities.community_uuid` is never NULL.

The implementation is `shared/src/auth/httpMessage.ts` (on top of [http-message-sig](https://www.npmjs.com/package/http-message-sig)), used by the `communityInfos` route in `core/src/crossCommunity/apiRoutes.ts` and by `ApiClient` beside it.

## Communication between communities

Requests between communities go to the routes of the federation-module under `/peer-api/v1/…`, sent by `ApiClient` (`core/src/crossCommunity/ApiClient.ts`). Except the request for the community infos, every request is signed with the key of the home community as an HTTP Message Signature, and accepted only from an authenticated community in the own `communities` table, by the key it is signed with. Requests can be encrypted with the encryption key of the community asked, and answers are signed by it, each as its route needs.

### Requests to other communities

The url of another community comes from that community. So that it cannot make a community send requests into its own network, in production every request to another community goes through `publicFetch` (`core/src/crossCommunity/publicFetch.ts`):

* The host is resolved when the connection is made, and the request fails if any of its addresses is not public. The connection goes to exactly the address checked, so a name that resolves to another address a moment later (DNS rebinding) changes nothing. Host header and TLS server name stay the name of the url. An address written in the url is checked before.
* A redirect is not followed; it counts as a failed answer. A community whose announced `http://` url only redirects to `https://` is therefore not reachable: its `FEDERATION_COMMUNITY_URL` has to name `https://`.
* Connections are kept alive in agents of their own (`peerHttpAgent`, `peerHttpsAgent` in `core/src/apis/ConnectionAgents.ts`), so that a kept connection is always one whose address was checked when it was opened.

Outside production the communities of a developer run on `localhost`, and requests go through `fetch` without the address check, but without following a redirect either.
