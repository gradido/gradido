# Introduction of Gradido-ID

## Motivation

The introduction of the Gradido-ID base on the requirement to identify an user account per technical key instead of using an email-address. Such a technical key ensures an exact identification of an user account without giving detailed information for possible missusage.

Additionally the Gradido-ID allows to administrade any user account data like changing the email address or define several email addresses without any side effects on the identification of the user account.

## Definition

The formalized definition of the Gradido-ID can be found in the document [BenutzerVerwaltung#Gradido-ID](../BusinessRequirements/BenutzerVerwaltung#Gradido-ID).

## Steps of Introduction

To Introduce the Gradido-ID there are several steps necessary. The first step is to define a proper database schema with additional columns and tables followed by data migration steps to add or initialize the new columns and tables by keeping valid data at all.

The second step is to decribe all concerning business logic processes, which have to be adapted by introducing the Gradido-ID.

### Database-Schema

#### Users-Table

The entity users has to be changed by adding the following columns.

| Column                   | Type   | Description                                                                                                       |
| ------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------- |
| gradidoID                | String | technical unique key of the user as UUID (version 4)                                                              |
| alias                    | String | a business unique key of the user                                                                                 |
| passphraseEncryptionType | int    | defines the type of encrypting the passphrase: 1 = email (default), 2 = gradidoID, ...                            |
| emailID                  | int    | technical foreign key to the entry with type Email and contactChannel=maincontact of the new entity UserContacts |

##### Email vs emailID

The existing column `email`, will now be changed to the primary email contact, which will be stored as a contact entry in the new `UserContacts` table. It is necessary to decide if the content of the `email `will be changed to the foreign key `emailID `to the contact entry with the email address or if the email itself will be kept as a denormalized and duplicate value in the `users `table.

The preferred and proper solution will be to add a new column `Users.emailId `as foreign key to the `UsersContact `entry and delete the `Users.email` column after the migration of the email address in the `UsersContact `table.

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

### Database-Migration

After the adaption of the database schema and to keep valid consistent data, there must be several steps of data migration to initialize the new and changed columns and tables.

#### Initialize GradidoID

In a one-time migration create for each entry of the `Users `tabel an unique UUID (version4).

#### Primary Email Contact

In a one-time migration read for each entry of the `Users `table the `Users.id` and `Users.email`, select from the table `login_email_opt_in` the entry with the `login_email_opt_in.user_id` = `Users.id` and create a new entry in the `UsersContact `table, by initializing the contact-values with:

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

#### Read-Write Access of Users-Table especially Email

The ORM mapping has to be adapted to the changed and new database schema.

#### Registration Process

The logic of the registration process has to be adapted by

* initializing the `Users.userID` with a unique UUID
* creating a new `UsersContact `entry with the given email address and *maincontact* as `usedChannel `
* set `emailID `in the `Users `table as foreign key to the new `UsersContact `entry
* set `Users.passphraseEncrpytionType = 2` and encrypt the passphrase with the `Users.userID` instead of the `UsersContact.email`

#### Login Process

The logic of the login process has to be adapted by

* search the users data by reading the `Users `and the `UsersContact` table with the email (or alias as soon as the user can maintain his profil with an alias)   as input
* depending on the `Users.passphraseEncryptionType` decrypt the stored password
  * = 1 :  with the email
  * = 2 : with the userID

#### Password En/Decryption

The logic of the password en/decryption has to be adapted by encapsulate the logic to be controlled with an input parameter. The input parameter can be the email or the userID.

#### Change Password Process

The logic of change password has to be adapted by

* if the `Users.passphraseEncryptionType` = 1, then

  * read the users email address from the `UsersContact `table
  * give the email address as input for the password decryption of the existing password
  * use the `Users.userID` as input for the password encryption for the new password
  * change the `Users.passphraseEnrycptionType` to the new value =2
* if the `Users.passphraseEncryptionType` = 2, then

  * give the `Users.userID` as input for the password decryption of the existing password
  * use the `Users.userID` as input for the password encryption fo the new password

#### Search- and Access Logic

A new logic has to be introduced to search the user identity per different input values. That means searching the user data must be possible by

* searching per email (only with maincontact as contactchannel)
* searching per userID
* searching per alias

#### Identity-Mapping

A new mapping logic will be necessary to allow using unmigrated APIs like GDT-servers api. So it must be possible to give this identity-mapping logic the following input to get the respective output:

* email -> userID
* email -> gradidoID
* email -> alias
* userID -> gradidoID
* userID -> email
* userID -> alias
* alias -> gradidoID
* alias -> email
* alias -> userID
* gradidoID -> email
* gradidoID -> userID
* gradidoID -> alias

#### GDT-Access

To use the GDT-servers api the used identifier for GDT has to be switch from email to userID.
