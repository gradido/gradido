# Gradido modules, configurations and dependencies

## Configurations

The configuration of the gradido modules are set by using the package `dotenv`.

### Templates

The configuration file `.env.template` contains all necessary configuration property names for the module and their values are set by still existing and exported properties with the same property-name. This will be expressed by the following expression:

`property_name = $property_name`

This template configuration file is registered in the git repository of the associated module.

### Distributions

The configuration file `.env.dist` contains all necessary configuration properties for the module and their values are set on default values used by the module.

The distribution configuration file is registered in the git repository of the associated module.

### Individuals

The configuration file `.env` contains all necessary configuration properties for the module including individual values.

The individual configuration file is optional and **not** registered in the git repository of the associated module.

### Handling of configuration files

#### module specific

The handling of the different configuration files are part of each module. The `dotenv` package defines and handles each of these three configuration files with the following dependency

```
.env
  +- .env.template
  +- .env.dist

```

#### centralized

A central kind of configuration handling is part of the unix bash script `gradido/deplyment/baremetal/start.sh`.

Property values defined in this file will **not** overwrite existing property values or will define new properties.

#### admin

### Distributions

### Individuals

## Modules

### Graphic User Interfaces

#### admin

#### frontend

#### gms_vue

#### humHub

### Backoffice

#### backend

#### dht

#### federation

#### dlt

#### gms

#### humHub
