import React from "react";

import Immutable from "immutable";
import {PropTypes} from "react";
import {Asset} from "common/MarketClasses";
import { connect } from "alt-react"
import MarketsStore from "stores/MarketsStore";
import utils from "common/utils";
import ChainTypes from "../Utility/ChainTypes";
import {ChainStore} from "seerjs/es";
import BindToChainState from "../Utility/BindToChainState";
import TotalBalanceValue from "../Utility/TotalBalanceValue";


class AssetToUSDTConverter extends React.Component {

    static propTypes = {
        balance: ChainTypes.ChainObject,
        base: PropTypes.object.isRequired,
    };

    constructor() {
        super();
        this.state = {
            height: null
        };
    }

    componentWillMount() {

    }

    componentDidMount() {

    }

    componentWillUnmount() {

    }

    render() {
        let { base ,currentAccount } = this.props;


        let account_balances = currentAccount.get("balances");

        let includedBalancesList = Immutable.List();

        if (account_balances) {
            // Filter out balance objects that have 0 balance or are not included in open orders
            account_balances = account_balances.filter((a, index) => {
                let balanceObject = ChainStore.getObject(a);
                if (balanceObject && (!balanceObject.get("balance"))) {
                    return false;
                } else {
                    return true;
                }
            });

            // Separate balances into hidden and included
            account_balances.forEach((a, asset_type) => {
                if (asset_type === base.get("id")) {
                    includedBalancesList = includedBalancesList.push(a);
                }
            });
        }

        return (
            <div>
                {/*<TotalBalanceValue*/}
                    {/*noTip*/}
                    {/*balances={includedBalancesList}*/}
                    {/*toAsset="1.3.0"*/}
                {/*/>*/}
                {/*&nbsp;*/}
                ≈&nbsp;
                <TotalBalanceValue
                    noTip
                    balances={includedBalancesList}
                    toAsset="1.3.5"
                />
            </div>
        );
    }
}

export default BindToChainState(AssetToUSDTConverter, {keep_updating: true});
