import React from "react";
import utils from "common/utils";
import {connect} from "alt-react";
import SettingsStore from "stores/SettingsStore";
import AccountImage from "../Account/AccountImage";
import Operation from "./Operation";

require("./operations.scss");

class TransactionOperation extends React.Component {

    static defaultProps = {
        op: [],
        current: "",
        block: null,
        hideOpLabel: false
    };

    static propTypes = {
        op: React.PropTypes.array.isRequired,
        current: React.PropTypes.string,
        block: React.PropTypes.number
    };

    componentWillReceiveProps(np) {
        if (np.marketDirections !== this.props.marketDirections) {
            this.forceUpdate();
        }
    }

    shouldComponentUpdate(nextProps) {
        if (!this.props.op || !nextProps.op) {
            return false;
        }
        return !utils.are_equal_shallow(nextProps.op[1], this.props.op[1]) ||
            nextProps.marketDirections !== this.props.marketDirections;
    }

    render() {
        let {op} = this.props;

        return (
            <div className="flex-align-middle tx_operation" style={{height:48,background:"#F8F8FA",padding:4,marginTop:25}}>
              <div style={{display:"inline-block",width: 40,height: 40}}>
                <AccountImage accountObject={op[1].from || op[1].issuer} size={{height: 40, width: 40}}/>
              </div>
              <table>
                <tbody>
                  <Operation {...this.props}/>
                </tbody>
              </table>
            </div>
        );
    }
}

TransactionOperation = connect(TransactionOperation, {
    listenTo() {
        return [SettingsStore];
    },
    getProps() {
        return {
            marketDirections: SettingsStore.getState().marketDirections
        };
    }
});

export default TransactionOperation;
