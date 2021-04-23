% blockchain structure
% - header
%   - subclaster name
%   - initial key type (ca_signed, self_signed)
%   - list of public keys, representing CA chain (if type is ca_signed,
%     chain is verified with CA_MASTER_PUB, which is hardcoded)
% - one or more initial admins (preferrably, 3)
%   - email
%   - name
%   - public key
%   - signature with initial key
% - ordering node (it is associated with subclaster blockchain in 1:1
%   relationship)
%   - type (ordering node)
%   - endpoint
%   - public key
%   - signature with any of admins
%
% from this point all other nodes follow in arbitrary order; admins can
% be added or removed by majority of admins signing the record (majority
% of 2 is 2); most of the nodes are described by their type, endpoint,
% public key
%
% data in subclaster blockchain is used for gradido blockchains


%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%



% typical launch process of a node
% - node is started, providing AdminKeyPub to it
% - it creates its own key pair (PrivKey, PubKey)
% - it stands ready for incoming request for its public key
%   - request has been signed by AdminKeyPriv
% - it returns its PubKey, signed by PrivKey
% - it waits for signed response, by AdminKeyPriv
% - for ordering node
%   - it puts record into blockchain, registering itself
% - for non-ordering node
%   - it sends record to ordering node