\--- in short

\- system becomes as distributed as possible

* gradido transfers are not routed via login server
* all parts are open-sourced
  * ofc, not main private key, not user database
  * added benefit of probably having open source development going on
    * there always can be some more things to add; we can allow ppl to

      do anything in unverified network
* unverified-with-gradido-organization groups and transactions can do

  whatever they want

\- two levels of gradido

* verified with gradido organization
* unverified (or verified with other entities)

\- login server disappears (or is "reprofiled" big time)

* instead, we have services which would offer authorised signatures

  for various transactions
  * new group in group blockchain
  * group update (becoming verified)
  * befriending verified groups
  * adding / moving user inside verified group
    * probably will use some 3rd party services for that
    * multiple strategies
      * visual ID card photos
      * face photos
      * "invited by" trusted person
  * creating gradidos inside verified group
* those transactions would be sent to hedera by community server
  * which implies community server holds submit key
    * which in turn implies there has to be a certain level of security
* those signatures have a semantics of "gradido organization authorizes

  this or that transaction"; it doesn't guarantee any success; some

  transactions may take signatures other parties
* some of those services may take days to return result
* for "unverified" gradido community server + node server those

  services are not needed

\- community server

* accesses hedera + node servers directly
  * therefore, it keeps hedera submitKey to itself
* hbar payment is done through there
* knows about node servers, their endpoints

\- users keep private keys to themselves

* less risk with someone attacking and compromising them
  * check "questions" section, though

\- so, gradido organization provides:

* signature services for verified (need to pick a better word? more

  like gradido-organization-verified) transactions
* open-sourced node + community server
* setup instructions
  * maybe scripts
  * maybe already deployed components with whom to start
    * community server? nodes?
    * for unverified as well, to promote popularity?

\- questions

* multiple group chains are possible; should they be supported?
  * which would mean multiple authorities (same like gradido

    organization)
* who administrates community server? hedera submitKey is located there
  * also, hedera account in mainnet requires a person which is verified

    with them
  * there has to be some "admins" therefore
* maybe could still have a "standalone login server" which would

  keep the keys in encrypted format for users, without doing anything

  else
  * it is not that important; main thing is to decide overall system

    design