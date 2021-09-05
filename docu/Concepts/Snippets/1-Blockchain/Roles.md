# Roles
User Roles also handled by blockchain and node servers

My Goal is to save not only the gradido transactions in blockchain but also 
who is allowed to create new gradidos,
who allow joining new user to the group,
who allow connect to another group and 
how the community decide which one is allowed to do this things.

## Why?
If this would be handled only by community-server everyone could be easly 
overwrite this rules by using a modified client to send his transactions direct over
hedera or iota bypassing the community-server rules. 
With hedera it is possible to only allow sending messages to a topic with the correct admin key,
but then is the admin the single point of failure. Also must the key saved on server to allow everyone 
sending gradidos or the transactions will only be proccessed, when admin is logging in.
If we don't use blockchain technologie at all, we have a big single point of failure. 
The Community-Server and everyone who has direct access to server and the admins of course.
But it would be much much simpler of course :)

In summary it is to make sure that the community is in power and no one can take over.

## How?
There is a special type of transactions with which users determine who can determine what.
This transaction control which signatures are neccessary for things like creation and so one.
For this I think different types are needed.
- *one*: The founder of group (or someone other choosen) decide everything, this is default from start
- *some*: a number of user must sign, set absolute count or relative count
- *most*: more than 1/2 or 3/4 must sign
- *all*: all member must sign, default for choose which mode will be used 
- *one-council*: one member of council
- *some-council*: absolute or relative number of council members must sign
- *most-council*: more than 1/2 or 3/4 from council members must sign
- *all-council*: all members of council must sign

this configuration can be done for different types of action,
so the voting-mode for creation may differ from voting mode for
add new members to community. Also the council members for different actions
may differ.
Also how to vote for council members is an extra type of action.

## Veto
Especially for *some* and *some-council* maybe also for other types.
The users there could vote but haven't yet and not all need to vote,
can make a Veto with Explanation which reset all existing signs of current vote,
and is needed to sign by all which again vote for the case.

## Summary
With that setup all community consense models should be possible except Democracy.
Democracy needs a secret ballot. The votes on blockchain are open (at least if someone knows which 
public-key belongs to which user). A secret ballot on blockchain is really hard. By my last
recherche I haven't found on. But maybe this can do the trick: https://secure.vote/

