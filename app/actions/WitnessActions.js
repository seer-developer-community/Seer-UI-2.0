import WalletApi from "../api/WalletApi";
import alt from "alt-instance";
import WalletDb from "stores/WalletDb";

class WitnessActions {
    createCollateral(args) {
        let tr = WalletApi.new_transaction();

        tr.add_type_operation("witness_create_collateral", args);
        return (dispatch) => {
            return WalletDb.process_transaction(tr, null, true).then(result => {
                console.log("witness_create_collateral result:", result);
                dispatch(true);
            }).catch(error => {
                console.log("witness_create_collateral error ----->", error);
                dispatch(false);
            });
        };
    }

    cancelCollateral(args) {
        let tr = WalletApi.new_transaction();

        tr.add_type_operation("witness_cancel_collateral", args);
        return (dispatch) => {
            return WalletDb.process_transaction(tr, null, true).then(result => {
                console.log("witness_cancel_collateral result:", result);
                dispatch(true);
            }).catch(error => {
                console.log("witness_cancel_collateral error ----->", error);
                dispatch(false);
            });
        };
    }

    claimCollateral(args) {
        let tr = WalletApi.new_transaction();

        tr.add_type_operation("witness_claim_collateral", args);
        return (dispatch) => {
            return WalletDb.process_transaction(tr, null, true).then(result => {
                console.log("witness_claim_collateral result:", result);
                dispatch(true);
            }).catch(error => {
                console.log("witness_claim_collateral error ----->", error);
                dispatch(false);
            });
        };
    }

    create(args) {
        let tr = WalletApi.new_transaction();

        tr.add_type_operation("witness_create", args);
        return (dispatch) => {
            return WalletDb.process_transaction(tr, null, true).then(result => {
                console.log("witness_create result:", result);
                dispatch(true);
            }).catch(error => {
                console.log("witness_create error ----->", error);
                dispatch(false);
            });
        };
    }

    update(args) {
        let tr = WalletApi.new_transaction();

        tr.add_type_operation("witness_update", args);
        return (dispatch) => {
            return WalletDb.process_transaction(tr, null, true).then(result => {
                console.log("witness_update result:", result);
                dispatch(true);
            }).catch(error => {
                console.log("witness_update error ----->", error);
                dispatch(false);
            });
        };
    }
}
export default alt.createActions(WitnessActions);
