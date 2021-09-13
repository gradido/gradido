# Deployment with Kubernetes - Overview
## Kubernetes in Short
Kubernetes is as service for orchestration of containers like Docker-Container.
It is designed to get a easy way to handle running enough instances per service depending on load. 
So Kubernetes can start more instances or shutdown running instances.
It works best with stateles Services. 
Stateles Services can be easy upscaled with kubernetes as long the kubernetes cluster has enough Server. 
More Difficult is it using with presistent storage like used by dbs or if user data cached in memory
like with Login-Server.

## Stateful Services
For stateful services like the Login-Server a consistent connection is needed for getting every request from a user to 
the same instance.
For that we need consistent hashing, ring hashing or googles Maglev hashing algorithmus for load balancing.

## Mariadb
### Multiple Instances
On default in kubernetes every service has at least two running instances so than one can be crashing or shutdown while
to other services the requests. So that kubernetes can shutdown one if the server on which it is run, 
hasn't enough ressources anymore and kubernetes like to restart it somewhere else.
For multiple instances for a db we need some way of replication. 

Mariadb supports **Master-Slave** with one Instance only writing and all other are readonly and
**Galera-Cluster** where every instance is a master and replicate every write to every other instance.

Upscaling Master-Slave is limited because there is always only one server which handle all the writing stuff.
If the Master crashes or is moved every user must wait until it is started again. 100% uptime isn't possible. 
Depending one replica style the changes on master occure in another order on slave. So better no absolute updates on numbers, 
like balance. And better double check if transactions.received field get the same time on every instance.

Galera-Cluster is perfect for limitless upscaling but has another important disadvantage for this project. 
By using Galera-Cluster the Auto-Increment field works different. It is possible that gaps exist.
The current Community-Server uses the Auto-Increment Field for ordering transaction. In Galera-Cluster it isn't possible anymore
and we need another service like iota for that.

### Single Instance
It seems possible to working with only one mariadb instance with kubernetes.
We must test how many users can be served with that. 
https://kubernetes.io/docs/tasks/run-application/run-single-instance-stateful-application/

As long the user numbers are not to big we probably can work with that for the moment. 

### Initalize and Migrate DB
It isn't as easy with Docker. Simply run init db on first startup and migrate after changes. 
This seems to be a good way:
https://andrewlock.net/deploying-asp-net-core-applications-to-kubernetes-part-7-running-database-migrations/

Initalize and migrate with kubernetes jobs and init containers.
As long db updates don't break old code version, rolling updates are possible.
First run db migration job (only once!), the init container sleeping while migration is in action and therefore
pause starting of new instances. After migration is finished, new instances can start with new code.
Than instances with old code can be gracefull shutdowned. 

## Helm
With Helm a kubernetes setup can be described with charts rather than a single big yaml file.










