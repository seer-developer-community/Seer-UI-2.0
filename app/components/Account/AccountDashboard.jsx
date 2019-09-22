import React from "react";
import Immutable from "immutable";
import Translate from "react-translate-component";
import BalanceComponent from "../Utility/BalanceComponent";
import TotalBalanceValue from "../Utility/TotalBalanceValue";
import SettleModal from "../Modal/SettleModal";
import {BalanceValueComponent} from "../Utility/EquivalentValueComponent";
import {Market24HourChangeComponent} from "../Utility/MarketChangeComponent";
import AssetName from "../Utility/AssetName";
import { RecentTransactions } from "./RecentTransactions";
import Proposals from "components/Account/Proposals";
import {ChainStore} from "seerjs/es";
import SettingsActions from "actions/SettingsActions";
import assetUtils from "common/asset_utils";
import counterpart from "counterpart";
import Icon from "../Icon/Icon";
import {Link} from "react-router/es";
import ChainTypes from "../Utility/ChainTypes";
import EquivalentPrice from "../Utility/EquivalentPrice";
import BindToChainState from "../Utility/BindToChainState";
import LinkToAssetById from "../Utility/LinkToAssetById";
import utils from "common/utils";
import BorrowModal from "../Modal/BorrowModal";
import DepositModal from "../Modal/DepositModal";
import ReactTooltip from "react-tooltip";
import SimpleDepositWithdraw from "../Dashboard/SimpleDepositWithdraw";
import SimpleDepositBlocktradesBridge from "../Dashboard/SimpleDepositBlocktradesBridge";
import { Apis } from "seerjs-ws";
import GatewayActions from "actions/GatewayActions";
import {Tabs, Tab} from "../Utility/Tabs";
import AccountOrdersSimple from "./AccountOrdersSimple";
import cnames from "classnames";
import TranslateWithLinks from "../Utility/TranslateWithLinks";
import { checkMarginStatus } from "common/accountHelper";
import SendModal from "../Modal/SendModal";
import PulseIcon from "../Icon/PulseIcon";
import WitnessActions from "../../actions/WitnessActions";
import FormattedAsset from "../Utility/FormattedAsset";
import AccountStore from "../../stores/AccountStore";

class CollateralRows extends React.Component {
  static defaultProps = {
  };

  static propTypes = {
    collaterals: ChainTypes.ChainObjectsList.isRequired,
    witnessId: ChainTypes.ChainObject.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      collaterals: [],
    };
  }

  componentWillMount() {
    Apis.instance().db_api().exec("get_objects", [this.props.collaterals]).then(r => {
      this.setState({collaterals: r})
    });
  }

  cancelCollateral(accountId, collateralId) {
    var args = {
      witness: this.props.witnessId,
      witness_account: accountId,
      collateral_id: collateralId,
    };
    WitnessActions.cancelCollateral(args);
  }

  claimCollateral(accountId, collateralId) {
    var args = {
      witness: this.props.witnessId,
      witness_account: accountId,
      collateral_id: collateralId,
    };
    WitnessActions.claimCollateral(args);
  }

  render(){
    const now =  new Date().valueOf() + new Date().getTimezoneOffset() * 60000;

    const collateralRows = this.state.collaterals.map(r => <tr key={r.id}>
      <td><Translate content="account.witness.collateral.title" /></td>
      {
        r.status ? <td><FormattedAsset amount={r.amount} asset="1.3.0" decimalOffset={5} /></td> : <td>0</td>
      }
      {
        r.status ? <td>0</td> :
          <td><FormattedAsset amount={r.amount} asset="1.3.0" decimalOffset={5} /></td>
      }
      <td>
        {
          r.status
            ? <button onClick={this.claimCollateral.bind(this, r.owner, r.id)} className={`button tiny fillet ${now > new Date(r.expiration).valueOf() ? '' : 'disabled'}`}>
                <Translate content="account.witness.collateral.claim"/>
              </button>
            : <button onClick={this.cancelCollateral.bind(this, r.owner, r.id)} className="button tiny fillet"><Translate content="account.witness.collateral.cancel"/></button>
        }
      </td>
    </tr>)
    return (
      <tbody>
      {collateralRows}
      </tbody>
    )
  }
}

class AccountDashboard extends React.Component {

    static propTypes = {
        balanceAssets: ChainTypes.ChainAssetsList,
        core_asset: ChainTypes.ChainAsset.isRequired
    };

    static defaultProps = {
        core_asset: "1.3.0"
    }

    constructor(props) {
        super();
        this.state = {
          sortKey: props.viewSettings.get("portfolioSort", "totalValue"),
          sortDirection: props.viewSettings.get("portfolioSortDirection", true), // alphabetical A -> B, numbers high to low
          settleAsset: "1.3.0",
          showHidden: false,
          depositAsset: null,
          withdrawAsset: null,
          bridgeAsset: null,
          alwaysShowAssets: [
            "SEER",
            // "USD",
            // "CNY",
            // "OPEN.BTC",
            // "OPEN.USDT",
            // "OPEN.ETH",
            // "OPEN.MAID",
            // "OPEN.STEEM",
            // "OPEN.DASH"
          ],
          oracle: {
            description: "",
            guaranty: 0,
            id: "",
            locked_guaranty: 0,
            owner: null,
            reputation: 0,
            script: "",
            volume: 0
          },
          witness: null
        }


        this.priceRefs = {};
        this.valueRefs = {};
        this.changeRefs = {};
        for (let key in this.sortFunctions) {
            this.sortFunctions[key] = this.sortFunctions[key].bind(this);
        }

        this.update = this.update.bind(this);
    }

    sortFunctions = {
        alphabetic: function(a, b, force) {
            if (a.key > b.key) return this.state.sortDirection || force ? 1 : -1;
            if (a.key < b.key) return this.state.sortDirection || force ? -1 : 1;
            return 0;
        }
    }

    componentWillMount() {
        this._checkMarginStatus();
        ChainStore.subscribe(this.update);
        this.update();

        Apis.instance().db_api().exec("get_oracle_by_account", [this.props.account.get("id")]).then((results) => {
            this.setState({oracle: results})
        });
    }

    componentWillUnmount() {
        ChainStore.unsubscribe(this.update);
    }

    update(obj) {
        let witness = ChainStore.getWitnessById(this.props.account.get("id"));
        if (witness) this.setState({witness: witness.toJS()})
    }

    _checkMarginStatus(props = this.props) {
        checkMarginStatus(props.account).then(status => {
            let globalMarginStatus = null;
            for (let asset in status) {
                globalMarginStatus = status[asset].statusClass || globalMarginStatus;
            };
            this.setState({globalMarginStatus});
        });
    }

    componentWillReceiveProps(np) {
        if (np.account !== this.props.account) {
            this._checkMarginStatus(np);
            this.priceRefs = {};
            this.valueRefs = {};
            this.changeRefs = {};
            setTimeout(this.forceUpdate.bind(this), 500);
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            !utils.are_equal_shallow(nextProps.balanceAssets, this.props.balanceAssets) ||
            !utils.are_equal_shallow(nextProps.backedCoins, this.props.backedCoins) ||
            !utils.are_equal_shallow(nextProps.balances, this.props.balances) ||
            nextProps.account !== this.props.account ||
            nextProps.settings !== this.props.settings ||
            nextProps.hiddenAssets !== this.props.hiddenAssets ||
            !utils.are_equal_shallow(nextState, this.state)
        );
    }

    _onSettleAsset(id, e) {
        e.preventDefault();
        this.setState({
            settleAsset: id
        });

        this.refs.settlement_modal.show();
    }

    _hideAsset(asset, status) {
        SettingsActions.hideAsset(asset, status);
    }

    _showDepositModal(asset, e) {
        e.preventDefault();
        this.setState({depositAsset: asset}, () => {
            this.refs.deposit_modal_new.show();
        });
    }

    _showDepositWithdraw(action, asset, fiatModal, e) {
        e.preventDefault();
        this.setState({
            [action === "bridge_modal" ? "bridgeAsset" : action === "deposit_modal" ? "depositAsset" : "withdrawAsset"]: asset,
            fiatModal
        }, () => {
            this.refs[action].show();
        });
    }

    _getSeparator(render) {
        return render ? <span>&nbsp;|&nbsp;</span> : null;
    }

    _onNavigate(route, e) {
        e.preventDefault();
        this.props.router.push(route);
    }

    triggerSend(asset) {
        this.setState({send_asset: asset}, () => {
            this.refs.send_modal.show();
        });
    }

    _renderBuy = (symbol, canBuy, assetName, emptyCell, balance) => {
        if(symbol === "SEER" && balance <= 100000) { // Precision of 5, 1 = 10^5
            return (
                <span>
                    <a onClick={this._showDepositWithdraw.bind(this, "bridge_modal", assetName, false)}>
                        <PulseIcon onIcon="dollar" offIcon="dollar-green" duration={1000} className="icon-14px" />
                    </a>
                </span>);
        } else {
            return canBuy && this.props.isMyAccount ?
                <span>
                    <a onClick={this._showDepositWithdraw.bind(this, "bridge_modal", assetName, false)}>
                        <Icon name="dollar" className="icon-14px" />
                    </a>
                </span> : emptyCell;
        }
    };

    _renderBalances(balanceList, optionalAssets, visible) {
        const {core_asset} = this.props;
        let {settings, hiddenAssets, orders} = this.props;
        let preferredUnit = settings.get("unit") || core_asset.get("symbol");
        let showAssetPercent = settings.get("showAssetPercent", false);

        const renderBorrow = (asset, account) => {
            let isBitAsset = asset && asset.has("bitasset_data_id");
            let modalRef = "cp_modal_" + asset.get("id");
            return {
                isBitAsset,
                borrowModal: !isBitAsset ? null : <BorrowModal
                    ref={modalRef}
                    quote_asset={asset.get("id")}
                    backing_asset={asset.getIn(["bitasset", "options", "short_backing_asset"])}
                    account={account}
                />,
                borrowLink: !isBitAsset ? null : <a onClick={() => {ReactTooltip.hide();this.refs[modalRef].show();}}><Icon name="dollar" className="icon-14px" /></a>
            };
        };

        let balances = [];
        // const emptyCell = "-";
        const emptyCell = "";
        balanceList.forEach( balance => {
            let balanceObject = ChainStore.getObject(balance);
            let asset_type = balanceObject.get("asset_type");
            let asset = ChainStore.getObject(asset_type);

            let directMarketLink, settleLink, transferLink;
            let symbol = "";
            if (!asset) return null;

            const assetName = asset.get("symbol");
            const notCore = asset.get("id") !== "1.3.0";
            const notCorePrefUnit = preferredUnit !== core_asset.get("symbol");

            let {market} = assetUtils.parseDescription(asset.getIn(["options", "description"]));
            symbol = asset.get("symbol");
            if (symbol.indexOf("OPEN.") !== -1 && !market) market = "USD";
            let preferredMarket = market ? market : preferredUnit;

            if (notCore && preferredMarket === symbol) preferredMarket = core_asset.get("symbol");

            /* Table content */
            directMarketLink = notCore ?
                <Link className="button tiny fillet" to={`/market/${asset.get("symbol")}_${preferredMarket}`}>
                  <Translate content="account.trade"/>
                </Link> :
                notCorePrefUnit ? <Link className="button tiny fillet" to={`/market/${asset.get("symbol")}_${preferredUnit}`}>
                    <Translate content="account.trade"/>
                  </Link> :
                emptyCell;
            transferLink = <a className="button tiny fillet" onClick={this.triggerSend.bind(this, asset.get("id"))}>
                <Translate content="wallet.link_transfer"/>
            </a>;

            let {isBitAsset, borrowModal, borrowLink} = renderBorrow(asset, this.props.account);

            /* Popover content */
            settleLink = <a href onClick={this._onSettleAsset.bind(this, asset.get("id"))}>
                <Icon name="settle" className="icon-14px" />
            </a>;

            const includeAsset = !hiddenAssets.includes(asset_type);
            const hasBalance = !!balanceObject.get("balance");
            const hasOnOrder = !!orders[asset_type];

            const thisAssetName = asset.get("symbol").split(".");
            const canDeposit =
                (
                    (thisAssetName[0] == "OPEN" || thisAssetName[0] == "RUDEX") &&
                    !!this.props.backedCoins.get("OPEN", []).find(a => a.backingCoinType === thisAssetName[1]) ||
                    !!this.props.backedCoins.get("RUDEX", []).find(a => a.backingCoin === thisAssetName[1])
                ) || asset.get("symbol") == "SEER";

            const canDepositWithdraw = !!this.props.backedCoins.get("OPEN", []).find(a => a.symbol === asset.get("symbol"));
            const canWithdraw = canDepositWithdraw && (hasBalance && balanceObject.get("balance") != 0);
            const canBuy = !!this.props.bridgeCoins.get(symbol);

            balances.push(
                <tr key={asset.get("symbol")} style={{maxWidth: "100rem"}}>
                    <td style={{textAlign: "left"}}>
                        <LinkToAssetById asset={asset.get("id")} />
                    </td>
                    <td style={{textAlign: "left"}}>
                        {hasBalance || hasOnOrder ? <BalanceComponent balance={balance} hide_asset /> : null}
                    </td>
                    {showAssetPercent ? <td style={{textAlign: "right"}}>
                        {hasBalance ? <BalanceComponent balance={balance} asPercentage={true}/> : null}
                    </td> : null}
                    <td>
                        {transferLink}
                        {directMarketLink}
                    </td>

                    {/*<td style={{textAlign: "center"}} className="column-hide-small" data-place="bottom" data-tip={counterpart.translate("tooltip." + (includeAsset ? "hide_asset" : "show_asset"))}>*/}
                        {/*<a style={{marginRight: 0}} className={includeAsset ? "order-cancel" : "action-plus"} onClick={this._hideAsset.bind(this, asset_type, includeAsset)}>*/}
                            {/*<Icon name={includeAsset ? "cross-circle" : "plus-circle"} className="icon-14px" />*/}
                        {/*</a>*/}
                    {/*</td>*/}
                </tr>
            );
        });

        if (optionalAssets) {
            optionalAssets.filter(asset => {
                let isAvailable = false;
                this.props.backedCoins.get("OPEN", []).forEach(coin => {
                    if (coin && (coin.symbol === asset)) {
                        isAvailable = true;
                    }
                });
                if (!!this.props.bridgeCoins.get(asset)) {
                    isAvailable = true;
                }
                let keep = true;
                balances.forEach(a => {
                    if (a.key === asset) keep = false;
                });
                return keep && isAvailable;
            }).forEach(a => {
                let asset = ChainStore.getAsset(a);
                if (asset && this.props.isMyAccount) {
                    const includeAsset = !hiddenAssets.includes(asset.get("id"));

                    const thisAssetName = asset.get("symbol").split(".");
                    const canDeposit =
                        !!this.props.backedCoins.get("OPEN", []).find(a => a.backingCoinType === thisAssetName[1]) ||
                        !!this.props.backedCoins.get("RUDEX", []).find(a => a.backingCoin === thisAssetName[1]) ||
                        asset.get("symbol") == "SEER";

                    const canBuy = !!this.props.bridgeCoins.get(asset.get("symbol"));

                    const notCore = asset.get("id") !== "1.3.0";
                    let {market} = assetUtils.parseDescription(asset.getIn(["options", "description"]));
                    if (asset.get("symbol").indexOf("OPEN.") !== -1 && !market) market = "USD";
                    let preferredMarket = market ? market : core_asset ? core_asset.get("symbol") : "SEER";
                    let directMarketLink = notCore ? <Link to={`/market/${asset.get("symbol")}_${preferredMarket}`}><Icon name="trade" className="icon-14px" /></Link> : emptyCell;
                    let {isBitAsset, borrowModal, borrowLink} = renderBorrow(asset, this.props.account);
                    if (includeAsset && visible || !includeAsset && !visible) balances.push(
                        <tr key={asset.get("symbol")} style={{maxWidth: "100rem"}}>
                            <td style={{textAlign: "left"}}>
                                <LinkToAssetById asset={asset.get("id")} />
                            </td>
                            <td>{emptyCell}</td>
                            <td className="column-hide-small">{emptyCell}</td>
                            <td className="column-hide-small">{emptyCell}</td>
                            <td className="column-hide-small">{emptyCell}</td>
                            <td>{emptyCell}</td>
                            <td style={{textAlign: "center"}}>
                                {canBuy  && this.props.isMyAccount ?
                                <span>
                                    <a onClick={this._showDepositWithdraw.bind(this, "bridge_modal", a, false)}>
                                        <Icon name="dollar" className="icon-14px" />
                                    </a>
                                </span> : emptyCell}
                            </td>
                            <td style={{textAlign: "center"}}>
                                {directMarketLink}
                            </td>
                            <td>
                                {isBitAsset ?
                                    <div className="inline-block" data-place="bottom" data-tip={counterpart.translate("tooltip.borrow", {asset: asset.get("symbol")})}>
                                        {borrowLink}{borrowModal}
                                    </div> : emptyCell}
                            </td>
                            <td>{emptyCell}</td>
                            <td style={{textAlign: "center"}} className="column-hide-small" data-place="bottom" data-tip={counterpart.translate("tooltip." + (includeAsset ? "hide_asset" : "show_asset"))}>
                                <a style={{marginRight: 0}} className={includeAsset ? "order-cancel" : "action-plus"} onClick={this._hideAsset.bind(this, asset.get("id"), includeAsset)}>
                                    <Icon name={includeAsset ? "cross-circle" : "plus-circle"} className="icon-14px" />
                                </a>
                            </td>
                        </tr>
                    );
                }
            });
        }

        balances.sort(this.sortFunctions[this.state.sortKey]);
        return balances;
    }

    _toggleHiddenAssets() {
        this.setState({
            showHidden: !this.state.showHidden
        });
    }

    _toggleSortOrder(key) {
        if (this.state.sortKey === key) {
            SettingsActions.changeViewSetting({
                portfolioSortDirection: !this.state.sortDirection
            });
            this.setState({
                sortDirection: !this.state.sortDirection
            });
        } else {
            SettingsActions.changeViewSetting({
                portfolioSort: key
            });
            this.setState({
                sortKey: key
            });
        }
    }

    render() {
        let {account, hiddenAssets, settings, orders} = this.props;
        let {showHidden} = this.state;

        if (!account) {
            return null;
        }

        let includedBalances, hiddenBalances;
        let account_balances = account.get("balances");

        let includedBalancesList = Immutable.List(), hiddenBalancesList = Immutable.List();

        if (account_balances) {
            // Filter out balance objects that have 0 balance or are not included in open orders
            account_balances = account_balances.filter((a, index) => {
                let balanceObject = ChainStore.getObject(a);
                if (balanceObject && (!balanceObject.get("balance") && !orders[index])) {
                    return false;
                } else {
                    return true;
                }
            });

            // Separate balances into hidden and included
            account_balances.forEach((a, asset_type) => {
                if (hiddenAssets.includes(asset_type)) {
                    hiddenBalancesList = hiddenBalancesList.push(a);
                } else {
                    includedBalancesList = includedBalancesList.push(a);
                }
            });

            let included = this._renderBalances(includedBalancesList, this.state.alwaysShowAssets, true);
            includedBalances = included;
            let hidden = this._renderBalances(hiddenBalancesList, this.state.alwaysShowAssets);
            hiddenBalances = hidden;
        }

        let portfolioHiddenAssetsBalance =
            <TotalBalanceValue
                noTip
                balances={hiddenBalancesList}
                hide_asset
            />;

        let portfolioActiveAssetsBalance =
            <TotalBalanceValue
                noTip
                balances={includedBalancesList}
                hide_asset
            />;
        let ordersValue =
            <TotalBalanceValue
                noTip
                balances={Immutable.List()}
                openOrders={orders}
                hide_asset
            />;

        const preferredUnit = settings.get("unit") || this.props.core_asset.get("symbol");

         let showAssetPercent = settings.get("showAssetPercent", false);

        // Find the current Openledger coins
        // const currentDepositAsset = this.props.backedCoins.get("OPEN", []).find(c => {
        //     return c.symbol === this.state.depositAsset;
        // }) || {};
        const currentWithdrawAsset = this.props.backedCoins.get("OPEN", []).find(c => {
            return c.symbol === this.state.withdrawAsset;
        }) || {};
        const currentBridges = this.props.bridgeCoins.get(this.state.bridgeAsset) || null;

        const preferredAsset = ChainStore.getAsset(preferredUnit);
        let assetName = !!preferredAsset ? preferredAsset.get("symbol") : "";
        if (preferredAsset) {
            const {prefix, name} = utils.replaceName(assetName, !!preferredAsset.get("bitasset_data_id"));
            assetName = (prefix || "") + name;
        }
        const hiddenSubText = <span style={{visibility: "hidden"}}>H</span>;

        return (
            <div className="grid-content app-tables no-padding" ref="appTables">
                <div className="content-block small-12" style={{paddingTop:"34px"}}>

                  {/* Send Modal */}
                  <SendModal id="send_modal_portfolio" ref="send_modal" from_name={this.props.account.get("name")} asset_id={this.state.send_asset || "1.3.0"}/>

                  <table className="table dashboard-table close-border table-hover">
                    <thead>
                    <tr>
                      <th colSpan="3" className="dashboard-table-title">
                        <div style={{display:"flex",flexDirection:"row",justifyContent:"space-between",alignContent:"center"}}>
                          <Translate component="span" content="account.portfolio" />
                          <span style={{fontSize:"14px",color:"#666",fontWeight:"normal"}}>
                            <Translate component="span" content="account.total_assets" />
                            {portfolioActiveAssetsBalance} SEER
                          </span>
                        </div>
                      </th>
                    </tr>
                    <tr>
                      <th width="33%"><Translate content="account.currency_type" /></th>
                      <th width="33%"><Translate content="gateway.balance" /></th>
                      <th><Translate content="account.perm.action" /></th>
                    </tr>
                    </thead>
                    <tbody>
                    {showHidden && hiddenBalances.length ? hiddenBalances : includedBalances}
                    </tbody>
                  </table>

                  <table className="table dashboard-table close-border table-hover" style={{marginTop:"34px"}}>
                    <thead>
                    <tr>
                      <th colSpan="4" className="dashboard-table-title">
                        <Translate component="span" content="account.collateral_and_deposit" />
                      </th>
                    </tr>
                    <tr>
                      <th width="25%"><Translate content="account.collateral_types" /></th>
                      <th width="25%"><Translate content="account.qty" /></th>
                      <th width="25%"><Translate content="account.release_collateral_qty"/></th>
                      <th><Translate content="account.perm.action" /></th>
                    </tr>
                    </thead>
                    {
                      this.state.witness ? <CollateralRows witnessId={this.state.witness.id} collaterals={this.state.witness.collaterals}/> : null
                    }
                    <tbody>

                    { this.state.oracle ?
                        <tr>
                            <td><Translate content="seer.oracle.oracle_guaranty" /></td>
                            <td>{this.state.oracle.guaranty}</td>
                            <td>{this.state.oracle.locked_guaranty}</td>
                            <td>
                              <Link to={"/account/" + this.props.account.get("id")+ "/update-oracle/" + this.state.oracle.id} className="button tiny fillet"><Translate content="account.witness.collateral.cancel"/></Link>
                            </td>
                        </tr>
                      : null
                    }
                    </tbody>
                  </table>

                  <AccountOrdersSimple {...this.props}>
                    <span style={{fontSize:"14px",color:"#666",fontWeight:"normal"}}>
                        <Translate component="span" content="account.total_order_amount" />
                             {ordersValue} SEER
                    </span>
                  </AccountOrdersSimple>

                  <SettleModal ref="settlement_modal" asset={this.state.settleAsset} account={account.get("name")}/>
                </div>

                {/* Deposit Modal */}
                {/* <SimpleDepositWithdraw
                    ref="deposit_modal"
                    action="deposit"
                    fiatModal={this.state.fiatModal}
                    account={this.props.account.get("name")}
                    sender={this.props.account.get("id")}
                    asset={this.state.depositAsset}
                    modalId="simple_deposit_modal"
                    balances={this.props.balances}
                    {...currentDepositAsset}
                    isDown={this.props.gatewayDown.get("OPEN")}
                /> */}

                {/* Withdraw Modal*/}
                <SimpleDepositWithdraw
                    ref="withdraw_modal"
                    action="withdraw"
                    fiatModal={this.state.fiatModal}
                    account={this.props.account.get("name")}
                    sender={this.props.account.get("id")}
                    asset={this.state.withdrawAsset}
                    modalId="simple_withdraw_modal"
                    balances={this.props.balances}
                    {...currentWithdrawAsset}
                    isDown={this.props.gatewayDown.get("OPEN")}
                />

                {/* Deposit Modal */}
                <DepositModal
                    ref="deposit_modal_new"
                    modalId="deposit_modal_new"
                    asset={this.state.depositAsset}
                    account={this.props.account.get("name")}
                    backedCoins={this.props.backedCoins}
                />

                {/* Bridge modal */}
                <SimpleDepositBlocktradesBridge
                    ref="bridge_modal"
                    action="deposit"
                    account={this.props.account.get("name")}
                    sender={this.props.account.get("id")}
                    asset={this.state.bridgeAsset}
                    modalId="simple_bridge_modal"
                    balances={this.props.balances}
                    bridges={currentBridges}
                    isDown={this.props.gatewayDown.get("TRADE")}
                />
            </div>

        );
    }
}

AccountDashboard = BindToChainState(AccountDashboard);

class BalanceWrapper extends React.Component {

    static propTypes = {
        balances: ChainTypes.ChainObjectsList,
        orders: ChainTypes.ChainObjectsList
    };

    static defaultProps = {
        balances: Immutable.List(),
        orders: Immutable.List()
    };

    componentWillMount() {
        if (Apis.instance().chain_id.substr(0, 8) === "cea4fdf4") { // Only fetch this when on BTS main net
            GatewayActions.fetchCoins();
            GatewayActions.fetchBridgeCoins();
        }
    }

    render() {
        let balanceAssets = this.props.balances.map(b => {
            return b && b.get("asset_type");
        }).filter(b => !!b);

        let ordersByAsset = this.props.orders.reduce((orders, o) => {
            let asset_id = o.getIn(["sell_price", "base", "asset_id"]);
            if (!orders[asset_id]) orders[asset_id] = 0;
            orders[asset_id] += parseInt(o.get("for_sale"), 10);
            return orders;
        }, {});

        for (let id in ordersByAsset) {
            if (balanceAssets.indexOf(id) === -1) {
                balanceAssets.push(id);
            }
        }

        let isMyAccount = AccountStore.isMyAccount(this.props.account);

        return (
            <AccountDashboard {...this.state} {...this.props} orders={ordersByAsset} balanceAssets={Immutable.List(balanceAssets)} isMyAccount={isMyAccount}/>
        );
    };
}

export default BindToChainState(BalanceWrapper);
