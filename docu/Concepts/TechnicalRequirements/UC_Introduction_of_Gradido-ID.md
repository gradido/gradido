# Introduction of Gradido-ID

## Motivation

To introduce the Gradido-ID base on the requirement to identify an user account per technical key instead of using an email-address. Such a technical key ensures an exact identification of an user account without giving detailed information for possible missusage.

Additionally the Gradido-ID allows to administrade any user account data like changing the email address or define several email addresses without any side effects on the identification of the user account.

## Definition

The definition of the Gradido-ID can be found in the document [BenutzerVerwaltung#Gradido-ID](../BusinessRequirements/BenutzerVerwaltung#Gradido-ID).

## Steps of Introduction

To Introduce the Gradido-ID there are several steps necessary. The first step is to define a proper database schema with additional columns and tables followed by data migration steps to add or initialize the new columns and tables by keeping valid data at all.

The second step is to decribe all concerning business logic processes, which have to be adapted by introducing the Gradido-ID.

### Database-Schema

#### Users-Table

##### new Columns

The database entity *Users* has to be extended by the new columns:

###### Gradido-ID

the technical key of the user as UUID

```
@Column({ length: 36, unique: true, nullable: false })
  Gradido-ID: string
```

###### Alias

an alias as business key of the user

```
@Column({ length: 255, unique: true, nullable: true, collation: 'utf8mb4_unicode_ci' })
  alias: string
```

###### Passphrase_Encryption_Type

defines the type of encrypting the passphrase: 1 = email (default), 2 = gradidoID, ...

```
@Column({ type: 'int', default: 1, unique: false, nullable: false })
passphrase_encryption_type: int
```

##### changed Columns

###### Email

the existing column email, will now be changed to the primary email contact, which will be stored as a contact entry in the new contact table. It is necessary to decide if the content of this column will be changed to a foreign key to the contact entry with the email address or if the email itself will be kept as a denormalized and duplicate value in the users table.

The preferred and proper solution will be to add a new column emailId as foreign key to the contact entry and delete the email column after the migration of the email address in the contact table.

```
  @Column({ name: 'eamil_id', unsigned: true, nullable: false })
  emailId: number

replaces the following column:

  @Column({ length: 255, unique: true, nullable: false, collation: 'utf8mb4_unicode_ci' })
  email: string

```

#### new Contact-Table

A new entity is introduced to store several contacts of different types like email, telephone or other kinds of contact addresses.

```
@Entity('user_contacts', { engine: 'InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' })
export class UserContacts extends BaseEntity {
```

###### Id

the technical key of a contact entity

```
@PrimaryGeneratedColumn('increment', { unsigned: true })
id: number
```

###### Type

Defines the type of contact entry as enum: Email, Phone, etc

```
  @Column({ name: 'type', unsigned: true, nullable: false })
  type: number
```

###### UserId

Defines the foreign key to the users table

```
  @Column({ name: 'user_id', unsigned: true, nullable: false })
  userId: number
```

###### Email

defines the address of a contact entry of type Email

```
  @Column({ length: 255, unique: true, nullable: false, collation: 'utf8mb4_unicode_ci' })
  email: string
```

###### Phone

defines the address of a contact entry of type Phone

```
  @Column({ length: 255, unique: true, nullable: false, collation: 'utf8mb4_unicode_ci' })
  phone: string
```

###### UsedChannel

define the contact channel for which this entry is confirmed by the user e.g. main address (default), infomail, contracting, advertisings, ...

```
  @Column({ length: 255, unique: true, nullable: false, collation: 'utf8mb4_unicode_ci' })
  usedChannel: string
```

### Database-Migration

After the adaption of the database schema and to keep valid data there must be several steps of data migration to initialize the new and changed columns and tables.

#### Initialize GradidoID

In a one-time migration create for each entry of the users tabel an unique UUID (version4).

#### Primary Email Contact

In a one-time migration read for each entry of the users table the users.id and users.email and create for it a new entry in the contact table, by initializing the contact-values with:

* Id = new technical key
* Type = Email
* UserId = users.Id
* Email = users.email
* Phone = null
* UsedChannel = "main address"

and update the users entry with users.emailId = contact.Id

After this one-time migration the column users.email can be deleted.

### Adaption of BusinessLogic

The following logic or business processes has to be adapted through introducing the Gradido-ID

#### Read-Write Access of Users-Table especially Email


#### Registration Process

#### Login Process

#### Password En/Decryption

#### Identity-Mapping
