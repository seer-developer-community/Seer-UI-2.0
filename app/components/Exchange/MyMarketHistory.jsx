import React from "react";
import {PropTypes} from "react";
import Immutable from "immutable";
import Ps from "perfect-scrollbar";
import Translate from "react-translate-component";
import market_utils from "common/market_utils";
import PriceText from "../Utility/PriceText";
import cnames from "classnames";
import SettingsActions from "actions/SettingsActions";
import SettingsStore from "stores/SettingsStore";
import { connect } from "alt-react";
import TransitionWrapper from "../Utility/TransitionWrapper";
import AssetName from "../Utility/AssetName";
import { ChainTypes as grapheneChainTypes } from "seerjs/es";
const {operations} = grapheneChainTypes;
import BlockDate from "../Utility/BlockDate";
import counterpart from "counterpart";
import ReactTooltip from "react-tooltip";
import getLocale from "browser-locale";

class MarketHistory extends React.Component {
    constructor(props) {
        super();
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !Immutable.is(nextProps.history, this.props.history) ||
            nextProps.baseSymbol !== this.props.baseSymbol ||
            nextProps.quoteSymbol !== this.props.quoteSymbol ||
            nextProps.className !== this.props.className ||
            nextProps.currentAccount !== this.props.currentAccount
        );
    }

    componentDidMount() {
        let historyContainer = this.refs.history;
        Ps.initialize(historyContainer);
    }

    componentDidUpdate() {
        let historyContainer = this.refs.history;
        Ps.update(historyContainer);
    }


    render() {
        let {history, myHistory, base, quote, baseSymbol, quoteSymbol, isNullAccount} = this.props;
        let historyRows = null;

        if (myHistory && myHistory.size) {
            let keyIndex = -1;
            let flipped = base.get("id").split(".")[2] > quote.get("id").split(".")[2];
            historyRows = myHistory.filter(a => {
                let opType = a.getIn(["op", 0]);
                return (opType === operations.fill_order);
            }).filter(a => {
                let quoteID = quote.get("id");
                let baseID = base.get("id");
                let pays = a.getIn(["op", 1, "pays", "asset_id"]);
                let receives = a.getIn(["op", 1, "receives", "asset_id"]);
                let hasQuote = quoteID === pays || quoteID === receives;
                let hasBase = baseID === pays || baseID === receives;
                return hasQuote && hasBase;
            })
            .sort((a, b) => {
                return b.get("block_num") - a.get("block_num");
            })
            .map(trx => {
                let order  = trx.toJS().op[1];
                keyIndex++;
                let paysAsset, receivesAsset, isAsk = false;
                if (order.pays.asset_id === base.get("id")) {
                    paysAsset = base;
                    receivesAsset = quote;
                    isAsk = true;

                } else {
                    paysAsset = quote;
                    receivesAsset = base;
                }

                let parsed_order = market_utils.parse_order_history(order, paysAsset, receivesAsset, isAsk, flipped);
                let direction = isAsk ? counterpart.translate("exchange.sell") : counterpart.translate("exchange.buy");
                const block_num = trx.get("block_num");
                return (
                    <tr key={"my_history_" + keyIndex}>
                        <BlockDate width="16.66666%" component="td" block_number={block_num} tooltip />
                        <td width="16.66666%">
                            <AssetName dataPlace="top" name={quoteSymbol} />/<AssetName dataPlace="top" name={baseSymbol} />
                        </td>
                        <td className={parsed_order.className} width="16.66666%">
                            <span className="price-integer">{direction}</span>
                        </td>
                        <td className={parsed_order.className} width="16.66666%">
                            <PriceText preFormattedPrice={parsed_order} />
                        </td>
                        <td width="16.66666%">{parsed_order.receives}</td>
                        <td width="16.66666%">{parsed_order.pays}</td>
                    </tr>
                );
            }).toArray();
        }

        return (
            <div className={this.props.className}>
                <div className="exchange-bordered small-12" style={{height: 266,padding:0,margin:0}}>

                    <div className="grid-block shrink left-orderbook-header market-right-padding-only">
                        <table className="table fixed-table market-right-padding market-order-table"> {/*text-right*/}
                            <thead>
                                <tr>
                                  <th style={{width: "16.66666%",textAlign:  "left"}}><Translate className="header-sub-title" content="exchange.market_history.date" /></th>
                                  <th style={{width: "16.66666%",textAlign:  "left"}}><Translate className="header-sub-title" content="exchange.market" /></th>
                                  <th style={{width: "16.66666%",textAlign:  "left"}}><Translate className="header-sub-title" content="exchange.direction" /></th>
                                  <th style={{width: "16.66666%",textAlign:  "left"}}><Translate className="header-sub-title" content="exchange.price" /></th>
                                  <th style={{width: "16.66666%",textAlign:  "left"}}><Translate className="header-sub-title" content="exchange.order_amount" />({baseSymbol ? <AssetName dataPlace="top" name={quoteSymbol} /> : null})</th>
                                  <th style={{width: "16.66666%",textAlign:  "left"}}><Translate className="header-sub-title" content="exchange.total" />({baseSymbol ? <AssetName dataPlace="top" name={baseSymbol} /> : null})</th>
                                </tr>
                            </thead>
                        </table>
                    </div>
                    <div
                        className="table-container grid-block market-right-padding-only no-overflow"
                        ref="history"
                        style={{maxHeight: 210, overflow: "hidden"}}
                    >
                        <table className="table fixed-table market-right-padding market-order-table">
                            <TransitionWrapper
                                component="tbody"
                                transitionName="newrow"
                            >
                                {historyRows}
                            </TransitionWrapper>
                        </table>
                    </div>
                </div>
            </div>
        );
    }
}

MarketHistory.defaultProps = {
    history: []
};

MarketHistory.propTypes = {
    history: PropTypes.object.isRequired
};

export default connect(MarketHistory, {
    listenTo() {
        return [SettingsStore];
    },
    getProps() {
        return {
            viewSettings: SettingsStore.getState().viewSettings
        };
    }
});
