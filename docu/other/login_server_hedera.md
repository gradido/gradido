# Login Server and Hedera

Login Server should be the part of the system which sends the most if not every message to hedera which should go over hedera.
To use Consensus Service topic IDs a needed, so Login Server should also manage Hedera Topic IDs.
For every group there is a topic id and also one global topic id for the whole gradido network for alias and birth hash blockchain.
Topic id must be created and they didn’t exist until end of days, for the existence there must be paid with Hedera Hashbars. So Login Server must update topics regulary with funded hedera accounts. 
And maybe it is good if it can also show the current state of topic id, how long they paid and how many hashbars left on account. But every get balance request cost also hashbars. 