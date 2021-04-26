- understanding of the system
  - abstract, conceptual model
    - levels
      - a ledger with user transfers (userA, userB, amount) and money
        creations (user, amount)
      - each ledger has certain rules (for example, transfer cannot
        happen if sender doesn't have enough funds; or creation sum for
        single user cannot exceed certain amount); by applying those
        rules all transfers in the ledger can be replayed and ledger can
        be deemed "plausible"
        - this alone is NOT enough to confirm that transfers actually
          happened, there has to be more to that (transfers have to be
          authorized in one or another way)
      - multiple such ledgers (blockchains, groups), each maintaining set
        of users inside group
      - groups can befriend each other, allowing cross group transfers
        between users
      - users can migrate from group to group
      - so, a set of rules exist for a group (for example, user has to
        be inside of the group to participate in that group's transfer;
        groups have to be friends for cross-group transfer to happen;
        etc.); this allows full replay and checking if ledger is
         plausible
  - such model could be implemented in various ways, for example, single
    server, single thread database application, or even with hand-written
    ledger, served by an accountant
    - idea is to put that together with concept of distributed network,
      with nodes, messages, etc.
      - from that comes choice to use Hedera, then Protobuf, C++
   - any solution should involve user authentication of some sort;
     public/private key signatures is a convenient choice
- hedera: pros and cons
  - pros (some are essentially needed features):
    - ordering of transactions
    - transaction sender is authorized
    - defense against flood with help of HBARs (their currency)
    - transactions are distributed
    - emerging industry standard
  - cons:
    - risk of sudden changes; for example, if Hedera decides to use
      different running hash calculation algorithm without prior notice,
      all network goes down
    - not all features are good, some are missing
    - their server uptime is not guaranteed
    - future is not guaranteed as well; what if after 5 years Hedera is
      shut down?... at that point there could be million transfer
      blockchains, built on top of it
      - that could be solved, though, by replaying transfers into new
        ledgers, etc.; still worth to consider
    - when connecting to hedera network only way to get current sequence
      id and running hash is to use getTopicInfo() call, which costs
      HBARs
- gradido node
  - hosts ledger data, therefore most important part of the system
    (kind of backend database)
  - performs data checks before insert, replays blockchains on restart
  - exchanges information with other nodes, requesting and sending
    blockchain data when necessary
  - provides blockchain data in convenient way for node users
  - listens to transaction data coming via Hedera network
    - all transactions are therefore stored in blockchain, regardless if
      they are possible and correct or not; hedera message sequence id
      list won't have holes in it
  - calculates fields when it is necessary (such as transaction result
    or "verdict"; for example, transfer may fail if user doesn't have
    enough funds
  - in its validation procedures implements all blockchain rules
    - transaction format allows format / rule versioning
  - can host multiple blockchains
    - actually, needs to host multiple blockchains for cross-group
      transfers
  - expects node user to provide other node endpoints and list of
    blockchains to maintain
    - otherwise, not conceptually strongly bound to user; it can be
      anything, for now there are two services, login server and
      community server
  - data is kept on hdd in a binary, yet simple, struct-like format;
    it is split in same sized blocks; all records have same length
- problems
  - user authentication
    - if a user can have more than one account, it opens way for creating
      of bot networks, essentially robbing honest players
      - user migration and cross group transfers would allow many ways
        to create bots
    - on the other hand, hardcore user authentication may scare off
      people
- conclusions
  - set of rules, allowing blockchain to be replayed, has to be very
    clearly defined (and considered)