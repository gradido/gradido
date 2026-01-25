#ifndef GRADIDO_BLOCKCHAIN_C_DATA_TRANSACTION_TYPE_H
#define GRADIDO_BLOCKCHAIN_C_DATA_TRANSACTION_TYPE_H

#ifdef __cplusplus
extern "C" {
#endif

/*!
 * \addtogroup enums
 * @{
 */

/*!
 * \enum grdd_transaction_type
 * Enum for different transaction types
 * !!! don't change order
 */
enum grdd_transaction_type {
    //! Invalid or Empty Transaction
    GRDD_TRANSACTION_TYPE_NONE = 0,

    //! Creation Transaction, creates new Gradidos
    GRDD_TRANSACTION_TYPE_CREATION,

    //! Transfer Transaction, move Gradidos from one account to another
    GRDD_TRANSACTION_TYPE_TRANSFER,

    //! Group Friends Update Transaction, update relationship between groups
    GRDD_TRANSACTION_TYPE_COMMUNITY_FRIENDS_UPDATE,

    //! Register new address or sub address to group or move address to another group
    GRDD_TRANSACTION_TYPE_REGISTER_ADDRESS,

    //! Special Transfer Transaction with timeout used for Gradido Link
    GRDD_TRANSACTION_TYPE_DEFERRED_TRANSFER,

    //! First Transaction in Blockchain
    GRDD_TRANSACTION_TYPE_COMMUNITY_ROOT,

    //! Redeeming deferred transfer
    GRDD_TRANSACTION_TYPE_REDEEM_DEFERRED_TRANSFER,

    //! Timeout deferred transfer, send back locked gdds
    GRDD_TRANSACTION_TYPE_TIMEOUT_DEFERRED_TRANSFER,

    //! Technical type for using it in for loops, as max index
    GRDD_TRANSACTION_TYPE_MAX_VALUE
};

/*! @} */

#ifdef __cplusplus
}
#endif

#endif /* GRADIDO_BLOCKCHAIN_C_DATA_TRANSACTION_TYPE_H */