 # how to speed up progress?
- proposal is to have few priority scenarios, then analyze them, going deeper into details; detailization would be team work, but implementation of necessary bits would be individual responsibility
  - prototyping can be used where things are not yet finished (login server, for example); GUI doesn't have to look great, no high- performance expectations, etc.
  - example
    - we want to see people from two different groups exchanging gradidos
    - one community server, one login server, one node server is
          set up for this test
          - all on the same server, probably on Dario's dev server
          - need detailed description of the procedure
            - login server has to have hedera account private key, from
              where to get it? if we want to go mainnet, account owner
              has to be verified; we need a clear procedure of setting up
              this server
          - ...
        - groupA, groupB are set up
          - community / login servers configured for that
          -  - necessary topics are created by hosting login server
          - need detailed description of the procedure
          - at this point, people can register in community server and
            do transfers
          - ...
        - userA (in groupA) and userB (in groupB) is set up
          - registration via community server
          - community server -> login server -> hedera -> node server
            chain is working
          - ...
        - groupA and groupB are befriended
          - ...
        - transfer occurs
          - ...
        - ...
    - example has to get deeper and deeper detailization, until it is ready
      and we know hardest challenges; then we just implement it, as each
      part of the system - one of our three services - has a clear list
      of what to do
      - in many cases we are developing procedures instead of code
- system security / usability analysis, most important conclusions
  - - blockchain cannot be considered valid without a message, originating
    from hedera, which gives a hash to test with
    - problem is that we cannot predict when the message comes, so it
      would be good to know latest hashed beforehand (this is important
      only when starting up node server; once existing chain is compliant
      with hash of newly received hedera message, all chain is considered
      valid)
      - if chain is not validated by direct message from hedera, it is
        inadvisable to use the data from related blockchain
      - data could be valid on other node servers, so maybe longer node
        start time is acceptable, if there are enough other nodes
      - current hash would be most useful for group blockchain, as it will
        change slowly, and (depending on data included there) that could
        prevent node from functioning for long time after it is started
- hedera-related problems
  - sudden changes (such as a new hashing algorithm version; this did
    occur recently; if such thing happens in mainnet, then our system is
    just instantly broken on global scale, hedera don't store messages
    longer than 10 minutes; we would need to store messages in raw form
    outside blockchain, until we have support for new hashing algorithm,
     then replay them and insert into blockchain)
  - outages (already have seen them with testnet)
  - account verification may fail without possibility to proceed in any
    direction
    - also, it requires verification of my photo and ID card (driver's
      licence); is it acceptable for login server needs?
  - it has to be somehow encrypted, otherwise it can be easily spoofed
    - changing sequence number, timestamp, adjusting hash, thus creating
      different valid blockchains
      - it is not that important, if a node can get current hash from
        other, trusted source; it would be good also to allow
        considerably faster node start
        - idea is to have "hash server" with SSL certificate from a valid
          authority; it would serve current hash for all needed topics;
          internally, it would just listen topics and keep track of latest
          hash; login server could demand that node server verifies its
          current hashes, if there is a discrepancy
          - yes, it would be global for all system, the same way as hedera
            is; we are fixing their lack of important feature here
        - do they have VPN on their mainnet? I don't have main account, cannot
      contact them, they simply don't verify my account for some reason
  - there can be bugs in data they are sending
    - one idea is to consider possibility to migrate data to a different
      topic, if certain topic gets broken down on hedera side
      - something akin to system restart; data is kept, but instance is
        a new one
        - hashes would change, as timestamps change; all other stuff is
          replay-able
- both peer and login server don't need to be reliable for node server;
  only reliable, trustful source of data is considered hedera

  # Answer Dario

  With scenarios do you mean something like:
user alex from group 1 send 100 GDD to user Paul from group 2?

With Prototyping would you like to replace the working login-server with
a python prototype version or only support not finished features with a python-prototype?
For example creating a new hedera account with few hashbars for automatic fee paying.
Write the prototype then directly in the same db or do we need than also a separat interface between
working and prototype login-server?

The Community Server are planned to support only one group, Login Server planned to support multiple groups,
but not implemented yet.
For fastet success we could use a setup with two Community Servers and two Login Servers.
But setup the servers currently need also some time

Do you mean detailed description of the setup procedure?
We can use the staging server for that, which Bernd has rentet for this purpose.

I have a verified hedera account.
One solution is that at least every login-server operator need a hedera account or we from Gradido
have an account an can create sub-accounts with some hashbars for login server operator, specially for
people which support gradido already with donations.
The plan is later to operate a hedera node and stake hashbars on it to earn enough hashbars to pay the fee for gradido transactions.

Current functions of Login-Server and Community-Server:
People can register, get email verification code sended, can activate account.


System Security:
yes, only messages from hedera are trusted
I think we can give node server also a small hedera account to pay fees for transactions like that to
get last hash of topic by startup
especially because I have planned to use also hedera for node discovery (at least at first, I know
most crypto use central dns seeder for that)


hedera related problems:
in my original node server code I have planned to store the proto messages serialized (raw)
plus additional indices for faster lookup, how do you save the transactions in your node server implementation?

Outages: User should be informed and must try it again later, or we must keep his private keys in memory
to try again later, but I recommend against it.
I think we can assume than hedera mainnet will be keept online most of the time, else it would loose value

man-in-the middle between hedera and node-server:
My assumption and understanding from hedera consensus service is, that I get transactions with a running hash.
A running hash is calculated from the previous transaction and the current transaction.
I can check the running hash to make sure nobody has changed the transaction on there way.
Every Time I can check the last running hash by hedera.
So to successfully manipulate the attacker must not only change one message, he must change every next.
And intercept also every consensus get topic info query call to hedera.
Or he able to change the message such that the new calculated running hash is the same like the original.

Broken Topic:
move to new topic
normally moving transaction go to old and new topic but in this case, if topic is not reachable any longer on hedera,
maybe we can put the outbount moving transaction instead to the old topic to the global topic.
But only if we have only occasionally broken topics.
I don't think it is a good idea to replay all transactions from one topic to another, to much room for manipulation.