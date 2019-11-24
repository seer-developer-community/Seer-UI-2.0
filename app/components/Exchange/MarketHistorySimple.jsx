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
        let {history, base, quote, baseSymbol, quoteSymbol, isNullAccount} = this.props;

        let historyRows = null;

        if (history && history.size) {
            let index = 0;
            let keyIndex = -1;
            let flipped = base.get("id").split(".")[2] > quote.get("id").split(".")[2];
            historyRows = this.props.history
            .filter(() => {
                index++;
                return index % 2 === 0;
            })
            .take(100)
            .map(order => {
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
                return (
                    <tr key={"history_" + keyIndex}>
                        <td className={parsed_order.className} width="33.333333%">
                          <PriceText preFormattedPrice={parsed_order} />
                            {/*{parsed_order.pays}*/}
                        </td>
                        <td width="33.333333%">{parsed_order.receives}</td>
                        <td className="tooltip" data-tip={new Date(order.time)} width="33.333333%">
                            {counterpart.localize(new Date(order.time), {type: "date", format: "short_market_history"})}
                        </td>
                    </tr>
                );
            }).toArray();
        }

        return (
            <div className="exchange-panel">
                <div className="exchange-panel-title">
                    <Translate content="exchange.history" style={{fontSize:"14px",fontWeight:"bold"}} />
                </div>

                <table className="market-history-table-title"> {/*text-right*/}
                    <thead>
                    <tr>
                        <th width="33.333333%"><span><Translate content="exchange.market_history.price"/>(<AssetName dataPlace="top" name={baseSymbol} />)</span></th>
                        <th width="33.333333%"><span><Translate content="exchange.market_history.amount"/>(<AssetName dataPlace="top" name={quoteSymbol} />)</span></th>
                        <th width="33.333333%"><Translate content="exchange.market_history.date" /></th>
                    </tr>
                    </thead>
                </table>
                <div
                    className="table-container grid-block market-right-padding-only no-overflow"
                    ref="history"
                    style={{maxHeight: 210, overflow: "hidden"}}>
                    <table className="market-history-table-content">
                        <TransitionWrapper
                            component="tbody"
                            transitionName="newrow">
                            {historyRows}
                        </TransitionWrapper>
                    </table>
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
