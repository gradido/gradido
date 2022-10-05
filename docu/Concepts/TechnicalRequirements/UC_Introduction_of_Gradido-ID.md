# Introduction of Gradido-ID

## Motivation

The introduction of the Gradido-ID base on the requirement to identify an user account per technical key instead of using an email-address. Such a technical key ensures an exact identification of an user account without giving detailed information for possible missusage.

Additionally the Gradido-ID allows to administrade any user account data like changing the email address or define several email addresses without any side effects on the identification of the user account.

## Definition

The formalized definition of the Gradido-ID can be found in the document [BenutzerVerwaltung#Gradido-ID](../BusinessRequirements/BenutzerVerwaltung#Gradido-ID).

## 1st Stage

The 1st stage of introducing the Gradido-ID contains several steps. The first step is to define a proper database schema with additional columns and tables followed by data migration steps to add or initialize the new columns and tables by keeping valid data at all.

The second step is to decribe all concerning business logic processes, which have to be adapted by introducing the Gradido-ID and handling the attributes of the new user_contacts table.

### Database-Schema

#### Users-Table

The entity users has to be changed by adding the following columns. The column State gives a hint about the working state including the ticket number.

| State          | Column                 | Type   | Description                                                                                                                                                   |
| -------------- | ---------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| *done #2125* | gradidoID              | String | technical unique key of the user as UUID (version 4)                                                                                                          |
| *done #2125* | alias                  | String | a business unique key of the user                                                                                                                             |
| *open*       | passwordEncryptionType | int    | defines the type of encrypting the passphrase: 1 = email (default), 2 = gradidoID, ...                                                                        |
| *done #2165* | emailID                | int    | technical foreign key to the UserContacts-Table with the entry of type Email, which will be interpreted as the maincontact from the Users table point of view |

##### Email vs emailID

The existing column `email`, will now be changed to the primary email contact, which will be stored as a contact entry in the new `UserContacts` table.

#### new UserContacts-Table

A new entity `UserContacts `is introduced to store several contacts of different types like email, telephone or other kinds of contact addresses.

| Column                | Type                | Description                                                                                                                                                            |
| --------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| id                    | int                 | the technical key of a contact entity                                                                                                                                  |
| type                  | int                 | Defines the type of contact entry as enum: Email, Phone, etc                                                                                                           |
| userID                | int                 | Defines the foreign key to the `Users` table                                                                                                                         |
| email                 | String              | defines the address of a contact entry of type Email                                                                                                                   |
| emailVerificationCode | unsinged bigint(20) | unique code to verify email or password reset                                                                                                                          |
| emailOptInType        | int                 | REGISTER=1, RESET_PASSWORD=2                                                                                                                                           |
| emailResendCount      | int                 | counter how often the email was resend                                                                                                                                 |
| emailChecked          | boolean             | flag if email is verified and confirmed                                                                                                                                |
| createdAt             | DateTime            | point of time the Contact was created                                                                                                                                  |
| updatedAt             | DateTime            | point of time the Contact was updated                                                                                                                                  |
| deletedAt             | DateTime            | point of time the Contact was soft deleted                                                                                                                             |
| phone                 | String              | defines the address of a contact entry of type Phone                                                                                                                   |
| contactChannels       | String              | define the contact channel as comma separated list for which this entry is confirmed by the user e.g. main contact (default), infomail, contracting, advertisings, ... |

##### ToDo:

The UserContacts, expecially the email contacts, will for future be categorized to communication channels for example to allow the user to define which information he will get on which email-contact (aspects of administration, contract, advertising, etc.)

### Database-Migration

After the adaption of the database schema and to keep valid consistent data, there must be several steps of data migration to initialize the new and changed columns and tables.

#### Initialize GradidoID (done #2125)

In a one-time migration create for each entry of the `Users `tabel an unique UUID (version4).

#### Primary Email Contact (done #1798)

In a one-time migration read for each entry of the `Users `table the `Users.id` and `Users.email` and create for it a new entry in the `UserContacts `table, by initializing the contact-values with:

* id = new technical key
* type = Enum-Email
* userID = `Users.id`
* email = `Users.email`
* emailVerifyCode = `login_email_opt_in.verification_code`
* emailOptInType = `login_email_opt_in.email_opt_in_type_id`
* emailResendCount = `login_email_opt_in.resent_count`
* emailChecked = `Users.emailChecked`
* createdAt = `login_email_opt_in.created_at`
* updatedAt = `login_email_opt_in.updated_at`
* phone = null
* usedChannel = Enum-"main contact"

and update the `Users `entry with `Users.emailId = UsersContact.Id` and `Users.passphraseEncryptionType = 1`

After this one-time migration and a verification, which ensures that all data are migrated, then the columns `Users.email`, `Users.emailChecked`, `Users.emailHash` and the table `login_email_opt_in` can be deleted.

### Adaption of BusinessLogic

The following logic or business processes has to be adapted for introducing the Gradido-ID

#### Capturing of alias

To avoid using the email as primary identifier it is necessary to introduce a capturing of the alias. It is not a good solution to create for existing users an individual alias by a migration. So each user should capture his own alias during registration- and/or login-process.

These requirements are described in the concept document [../BusinessRequirements/UC_Set_UserAlias.md]() **(done #2144)** and the implementation of these requirements will be the prerequisite for changing the login-process from single email-identifier to the future identifiers alias / gradidoID / email.

#### Read-Write Access of Users-Table especially Email (done #1798)

The ORM mapping has to be adapted to the changed and new database schema.

#### Create and Update User Processes

The logic of the create and update user process has to be adapted by

* creating a new User including with a unique UUID-V4 **(done #2125)**
* creating a new `UserContacts `entry with the given email address **(#2165)**
* set `emailID `in the `Users `table as foreign key to the new `UserContacts `entry **(#2165)**
* handling the new emailXXX attributes in the `user_contacts `table previously in the `email_opt_in `table **(#2165)**

#### Search User Processes (#2165)

The logic of all processes where the user is searched has to be adapted by

* always search a *user* with its relation "emailContact" to load the associated userContact with his email
* a search user by *email* has to be implemented by searching a `userContact `for the given *email* and its relation "user" to load the associated user to this email

#### Password Processes (#2165)

The logic of all password processes has to be adapted by

* read the *emailXXX* attributes out of the `user_contacts `table instead of previoulsy from the `email_opt_in `table
* writing or updating the *emailXXX* attributes now in the `user_contact `table instead of previously in the `email_opt_in `table
* the logic how to de/encrypt the password will not part of this 1st stage of introduction of the gradidoID. This will be part of the 2nd stage

## 2nd Stage

In the 2nd stage of this topic the password handling during registration and login process will be changed. These change must keep the current active password handling where the email is part of the encryption as long as all users are shifted to the new logic of password handling where the gradidoID will part of the encryption. This means there must be a kind of versioning which type of password encryption is currently used, because in the future there could be the requirement to change the password handling to newer and safer algorithms.

### Database-Schema

#### Users-Table

The entity *users* has to be changed by

| Action | Column                 | Type       | Description                                                                         |
| :----: | ---------------------- | ---------- | ----------------------------------------------------------------------------------- |
|  add  | passwordEncryptionType | int        | defines the type of encrypting the password: default 1 = email, 2 = gradidoID, ...  |
| delete | public_key             | binary(32) | before deletion verify and ensure that realy not in use even for encryption type 1 |
| delete | privkey                | binary(80) | before deletion verify and ensure that realy not in use even for encryption type 1 |
| delete | email_hash             | binary(32) | before deletion verify and ensure that realy not in use even for encryption type 1 |
| delete | passphrase             | text       | before deletion verify and ensure that realy not in use even for encryption type 1 |

### Adaption of BusinessLogic

#### Password En/Decryption

The logic of the existing password en/decryption has to be shifted out of the `UserResolver.js` file in separated file(s). This separated file will be placed in the package-directory `backend/src/password` and named `emailEncryptor.js`. As the name express the password encryption uses the `email `attribute. 

For the new password encryption logic a new file named `gradidoIDEncryptor.js` has to be created in the package-directory `backend/src/password`. For possible future requirements of newer and safer encryption logic additional files can be placed in the same directory with expressiv file names.

All these `xxxEncryptor `files has to implement the following API, but with possibly different parameter types, depending on the encryption requirements:

| API                  | emailEncryptor   | gradidoIDEncryptor | return             | description                                                                                                                                    |
| -------------------- | ---------------- | ------------------ | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **encryptPassword** | dbUser, password | dbUser, password   | encrypted password | process the encryption with<br />the encryptor specific attributs <br />out of the dbUser and the original <br />password entered by the user |
| **verifyPassword**  | dbUser, password | dbUser, password   | boolean            | process the decryption with<br />the encryptor specific attributs <br />out of the dbUser and the original <br />password entrered by the user |
| **isPassword**      | password         | password           | boolean            | verifiy the formal rules of the original<br />password entered by the user                                                                     |

Which of the *xxxEncryptor* implementations will be used, depends on the value of the attribute `user.passwordEncryptionType`, which has to be interpreted before.

The new Enum `PasswordEncryptionType `with the increasing values:

* 1 = emailEncryptor
* 2 = gradidoIDEncryptor
* ... = ?

will be used to define the order which encryptor implementation is the oldest and the newest. That means if a user is still not using the newest encryptor for his password encryption the business logic will implicit start a change to the newest encryptor. This has to be inserted in all business processes, where the user enters his password, because without the original entered password from the user no encryptor upgrade can be done.

#### Registration Process

The logic of the registration process has to be adapted

* the general business logic of the ***createUser*** process will not be changed
* during the user creation set the attribut `Users.passwordEncrpytionType = 2`
* on activating the email-confirmation link the **queryOptIn** methode of the `UserResolver `is called
* because of the `users.passwordEncryptionType = 2` the `gradidoIDEncryptor `has to be used for encrypting  and setting the password
* the `gradidoIDEncryptor`
  * encrypts the password with the `Users.gradidoID` instead of the `UserContacts.email`
  * it will creates a password-hash by using the gradidoID
* 

#### Login Process

The logic of the login process has to be adapted by

* search the users data by reading the `Users `and the `UsersContact` table with the `email` as input **(ongoing #2165)**
* depending on the `Users.passwordEncryptionType` decrypt the stored password
  * = 1 :  with the email and the existing cryptographical logic (asymetric encryption)
  * = 2 : with the gradidoID and the new cryptographical logic (hashing)#### Change Password Process
