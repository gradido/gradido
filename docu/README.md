# Gradido Documentation

## APIs

The API Documentation is separated by which server answers them. Either the community server or login server. Therefore the documentation is split into two parts accordingly.

- [login-server API](./login_server.api.md)
- [community-server API](./community-server.api.md)

### Process - Reset password

1. Send user email with email verification code: [Send E-Mails](https://github.com/gradido/gradido/blob/master/docu/login_server.api.md#send-e-mails)
2. Login via emailVerificationCode: [Login by Email Verification Code](https://github.com/gradido/gradido/blob/master/docu/login_server.api.md#login-by-email-verification-code)
3. change password: [Update user data](https://github.com/gradido/gradido/blob/master/docu/login_server.api.md#update-user-data)

## Graphics

The following Graphics try to show certain mechanics, principles and structures of the gradido project

### Cookie mechanic
![](./graphics/cookie.png)

### Software structure transition

An Idea of how to transform the Software structure step by step to keep it working, while transitioning to a more modern and strict structure.
The basic Idea is to create a unified API to communicate with the outside world, while the existing services are hidden behind it. Furthermore the community server is under consideration to be absorbed by this new unified API Interface. This would remove PHP as language from the project, unify the API and separate front from backend.

In the long run (shown as the last section in the graphic) it could be wise to fully decentralize the login server completely.

![](./graphics/neue-struktur.png)

### Old or outdated stuff

Graphics get outdated - this section is the graveyard for those.

#### Software release plan stage0-3

In the past a waterfall-like development method was used which resulted in multiple big branches not yet compatible. This graphic shows how and in which order those branches o existing code could be integrated.

We quickly managed to go from `stage0` to `stage1`. `stage2` and `stage3` will be one step now, if we can reuse this code.

![](./graphics/release-stages.png)

#### Frontend authentication idea

Some ideas of regarding fixing the broken authentication

![](./graphics/frontend_vue.png)

#### Repo structure

One upon a time the repository was split into multiple parts. This compartimalisation resulted in some inefficiencies which were resolved by merging (most of) them into a mono repository. The following graphic was made to explain the idea and plan the "mono-repoisation"

![](./graphics/repo-structure.png)

## Questions

### why distributed system for gradidos? is it needed to add this type of complexity?

- ensuring uptime
- data is not stored in single place, no single point of failure
- even if most important nodes are hacked, we still have a replayable gradido blockchains, which can be migrated to another cluster

### main ideas for gradido distributed system

- system would rely on existence of honest / incorrupted nodes in the network
- consists of nodes (not gradido nodes, but universal ones)
- using blockchains to store data
- generally open and transparent, with few exceptions (monitoring health, last-resort backup creation)
- single topology blockchain for a cluster; TB contains at least:
  - list of all nodes in the cluster along with their types
  - updates to states of nodes (active, banned, etc.)
- not all nodes can write to all blockchains
- distributed system consists of nodes, each having at least:
  - type
  - signature key
  - copy of TB
- read sequence: sending same request to random many nodes, receiving answer, reporting other nodes to management in case of discrepancies, which could lead to node ban
- write sequence: transaction goes to ordering service, receives consensus sequence id, is sent to listener nodes, is written to blockchain replicas

### proposed nodes
- management node
  - adding new nodes to network on request, banning nodes
  - should be maintained by us for our cluster
- ordering node
  - orders requests just like Hedera; can use Hedera (at least initially)
- login server node
- gradido blockchain node
- gradido blockchain backup node
- relay node: to anonymize blockchain read requests (for better cluster health)
- community server is not a node; it stands out from distributed network and accesses cluster via login server

### example sequences

- user actions
  - browse groups
    - community server addresses login server; login server has TB; it asks for data, reporting invalid nodes in the process; result is returned to community server and presented
    - required signatures: community server
  - create group
    - community server -> login server node -> management node (as it has to write to TB)
    - required signatures: community server, login server node, management node
  - join group
    - by invitation: applies for invitation via email, gets link to URL (hosted by community server), clicks it, login server node gets notification
    - required signatures: community server, login server node
  - do work
    - hours worked could be stored on community server, as necessary
  - receive gradidos
    - sent by group leader; they cannot exceed amount set in rules
  - cross group transfer
    - sender@sender-group issues request via community server, mentioning recipient@recipient-group in it; sender's login server receives it, adds outbound transfer on sender-group blockchain, notifies login server of receiver-group (found by looking up in TB); inbound transfer is added to recipient-group's blockchain by login server #2
    - required signatures: community server, both login servers

### how it comes together with model we have

- user id would not be his email but username@gradido-group-name
- gradido node server would keep:
  - gradido group blockchains, which are associated with its login server (then it would be primary gradido node for particular gradido group)
  - other blockchains - such as those which are necessary often, or needed to support network with backups (then it would be support gradido node for particular group)
- when reading blockchain data from a gradido node, random nodes are picked from each of the three buckets:
  - primary gradido nodes
  - support gradido nodes
  - trusted gradido nodes: maintained by us
- growing of the cluster
  - we could maintain some basic infrastructure to which it would be possible to add new nodes by other players
    - existing login servers could be reused, for example; this way groups could be set up quickly

### known weaknesses

- hedera and flood
  - cannot deny write access
- if blockchain is public, then a participant can find out public key of its recent partner in transfer
  - maybe that can be classified with time; but if we use Hedera, all data is public

### development

- it is possible to have basic version quickly
  - only one way of joining a gradido group: by invitation
  - only one type of gradido group: dictatorship (single person makes decisions)
- prototyping
  - demo in Erlang
- within this model it is possible to ensure fault tolerance, resilience against flooding, resilience against timeout attacks, rollbacks, migration procedures; we can focus on main features in the beginning

### other

- each node could have credibility rating, built over time
- if gradido node gets corrupted, login server node may get ban as well
- all requests are signed by issuing node's private key; those can be used as evidence to track down source of hacker activity
- consider the model described in this file as an "umbrella" for existing ideas of community server, login server, node server
- possibility to have gradido organization badge for identified groups / individuals
- user migration from group to group may involve two login servers
- login server is actually a group of replicas
- anyone can create a gradido cluster for his own needs; it is not mandatory to join our cluster
- good practice would be to store memo along with gradido creations, always
- gradido groups could have ratings
- only management nodes can write to TB
- only login server nodes may write to their primary group blockchains
- clusters could be merged (gradido blockchains would migrate along with gradido nodes / login servers)
- management nodes are considered primary nodes for TB
- different programming languages could be used to implement various types of nodes, to improve safety and security
- most of nodes are simple by themselves, easy to make
- transaction ids are generated on sender's side