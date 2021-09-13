# Create and Delete on Command Line
## Dependencies
Kubernetes must be installed first
for example like this:
https://microk8s.io/
with 
alias kubectl="microk8s kubectl"

## Create
Create persistent volume and persisten volume claim for db datas
Create single instance pod with mariadb
```bash
kubectl apply -f mariadb-pv.yaml
kubectl apply -f db_single.yaml
```

## Delete
```bash
kubectl delete deployment,svc mariadb
kubectl delete pvc mariadb-pv-claim
kubectl delete pv mariadb-pv-volume
```

## Access db with command line client
kubectl run -it --rm --image=mysql:5.6 --restart=Never mysql-client -- mysql -h mariadb -pja_sk8iWu37la_sl -u gradido_community
