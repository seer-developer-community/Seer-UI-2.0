import React from "react";
import Translate from "react-translate-component";
import classnames from "classnames";
import AssetActions from "actions/AssetActions";
import HelpContent from "../Utility/HelpContent";
import utils from "common/utils";
import {ChainStore, ChainValidation} from "seerjs/es";
import FormattedAsset from "../Utility/FormattedAsset";
import counterpart from "counterpart";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import AssetSelector from "../Utility/AssetSelector";
import big from "bignumber.js";
import cnames from "classnames";
import assetUtils from "common/asset_utils";
import {Tabs, Tab} from "../Utility/Tabs";
import AmountSelector from "../Utility/AmountSelector";
import assetConstants from "chain/asset_constants";
import { estimateFee } from "common/trxHelper";

let GRAPHENE_MAX_SHARE_SUPPLY = new big(assetConstants.GRAPHENE_MAX_SHARE_SUPPLY);

class AccountAssetCreate extends React.Component {

    static propTypes = {
        core: ChainTypes.ChainAsset.isRequired,
        globalObject: ChainTypes.ChainObject.isRequired
    };

    static defaultProps = {
        globalObject: "2.0.0",
        core: "1.3.0"
    }

    constructor(props) {
        super(props);

        this.state = this.resetState(props);
    }

    resetState(props) {
        // let asset = props.asset.toJS();
        let precision = utils.get_asset_precision(4);
        let corePrecision = utils.get_asset_precision(props.core.get("precision"));

        let {flagBooleans, permissionBooleans} = this._getPermissions(0);

        // let flags = assetUtils.getFlags(flagBooleans);
        // let permissions = assetUtils.getPermissions(permissionBooleans, isBitAsset);
        // console.log("all permissions:", permissionBooleans, permissions)

        let coreRateBaseAssetName = ChainStore.getAsset("1.3.0").get("symbol");

        return {

            update: {
                symbol: "",
                precision: 4,
                max_supply: 100000,
                max_market_fee: 0,
                market_fee_percent: 0,
                description: {main: ""}
            },
            errors: {
                max_supply: null
            },
            isValid: true,
            flagBooleans: flagBooleans,
            permissionBooleans: permissionBooleans,
            core_exchange_rate: {
                quote: {
                    asset_id: null,
                    amount: 1
                },
                base: {
                    asset_id: "1.3.0",
                    amount: 1
                }
            },
            marketInput: ""
        };
    }

    _getPermissions(state) {
        let flagBooleans = assetUtils.getFlagBooleans(0);
        let permissionBooleans = assetUtils.getFlagBooleans("all");

        return {
            flagBooleans,
            permissionBooleans
        }
    }

    _createAsset(e) {
        e.preventDefault();
        let {update, flagBooleans, permissionBooleans, core_exchange_rate} = this.state;

        let {account} = this.props;

        let flags = assetUtils.getFlags(flagBooleans);
        let permissions = assetUtils.getPermissions(permissionBooleans);

        if (this.state.marketInput !== update.description.market) {
            update.description.market = "";
        }
        let description = JSON.stringify(update.description);

        AssetActions.createAsset(account.get("id"), update, flags, permissions, core_exchange_rate, description).then(result => {
            console.log("... AssetActions.createAsset(account_id, update)", account.get("id"),  update, flags, permissions)
        });
    }

    _hasChanged() {
        return !utils.are_equal_shallow(this.state, this.resetState(this.props));
    }

    _reset(e) {
        e.preventDefault();

        this.setState(
            this.resetState(this.props)
        );
    }

    _forcePositive(number) {
        return parseFloat(number) < 0 ? "0" : number;
    }

    _onUpdateDescription(value, e) {
        let {update} = this.state;
        let updateState = true;

        switch (value) {
            case "condition":
                if (e.target.value.length > 60) {
                    updateState = false;
                    return;
                }
                update.description[value] = e.target.value;
                break;

            case "short_name":
                if (e.target.value.length > 32) {
                    updateState = false;
                    return;
                }
                update.description[value] = e.target.value;
                break;

            case "market":
                update.description[value] = e;
                break;

            case "visible":
                update.description[value] = !update.description[value];
                break;

            default:
                update.description[value] = e.target.value;
                break;
        }

        if (updateState) {
            this.forceUpdate();
            this._validateEditFields(update);
        }
    }

    onChangeBitAssetOpts(value, e) {
        let {bitasset_opts} = this.state;

        switch (value) {
            case "force_settlement_offset_percent":
            case "maximum_force_settlement_volume":
                bitasset_opts[value] = parseFloat(e.target.value) * assetConstants.GRAPHENE_1_PERCENT;
                break;
            case "minimum_feeds":
                bitasset_opts[value] = parseInt(e.target.value, 10);
                break;
            case "feed_lifetime_sec":
            case "force_settlement_delay_sec":
                console.log(e.target.value, parseInt(parseFloat(e.target.value) * 60, 10));
                bitasset_opts[value] = parseInt(parseFloat(e.target.value) * 60, 10);
                break;

            case "short_backing_asset":
                bitasset_opts[value] = e;
                break;

            default:
                bitasset_opts[value] = e.target.value;
                break;
        }

        this.forceUpdate();
    }

    _onUpdateInput(value, e) {
        let {update, errors} = this.state;
        let updateState = true;
        let shouldRestoreCursor = false;
        let precision = utils.get_asset_precision(this.state.update.precision);
        const target = e.target;
        const caret = target.selectionStart;
        const inputValue = target.value;

        switch (value) {
            case "market_fee_percent":
                update[value] = this._forcePositive(target.value);
                break;

            case "max_market_fee":
                if ((new big(inputValue)).times(precision).gt(GRAPHENE_MAX_SHARE_SUPPLY)) {
                    errors.max_market_fee = "The number you tried to enter is too large";
                    return this.setState({errors});
                }
                target.value = utils.limitByPrecision(target.value, this.state.update.precision);
                update[value] = target.value;
                break;

            case "precision":
                // Enforce positive number
                update[value] = this._forcePositive(target.value);
                break;

            case "max_supply":
                shouldRestoreCursor = true;

                const regexp_numeral = new RegExp(/[[:digit:]]/);

                // Ensure input is valid
                if(!regexp_numeral.test(target.value)) {
                    target.value = target.value.replace(/[^0-9.]/g, "");
                }

                // Catch initial decimal input
                if(target.value.charAt(0) == ".") {
                    target.value = "0.";
                }

                // Catch double decimal and remove if invalid
                if(target.value.charAt(target.value.length) != target.value.search(".")) {
                    target.value.substr(1);
                }

                target.value = utils.limitByPrecision(target.value, this.state.update.precision);
                update[value] = target.value;

                // if ((new big(target.value)).times(Math.pow(10, precision).gt(GRAPHENE_MAX_SHARE_SUPPLY)) {
                //     return this.setState({
                //         update,
                //         errors: {max_supply: "The number you tried to enter is too large"
                //     }});
                // }
                break;

            case "symbol":
                shouldRestoreCursor = true;
                // Enforce uppercase
                const symbol = target.value.toUpperCase();
                // Enforce characters
                let regexp = new RegExp("^[\.A-Z]+$");
                if (symbol !== "" && !regexp.test(symbol)) {
                    break;
                }
                ChainStore.getAsset(symbol);
                update[value] = this._forcePositive(symbol);
                break;

            default:
                update[value] = target.value;
                break;
        }

        if (updateState) {
            this.setState({update: update}, () => {
                if(shouldRestoreCursor) {
                    const selectionStart = caret - (inputValue.length - update[value].length);
                    target.setSelectionRange(selectionStart, selectionStart);
                }
            });
            this._validateEditFields(update);
        }
    }

    _validateEditFields( new_state ) {
        let errors = {
            max_supply: null
        };

        errors.symbol = ChainValidation.is_valid_symbol_error(new_state.symbol);
        let existingAsset = ChainStore.getAsset(new_state.symbol);
        if (existingAsset) {
            errors.symbol = counterpart.translate("account.user_issued_assets.exists");
        }

        try {
            errors.max_supply = new_state.max_supply <= 0 ? counterpart.translate("account.user_issued_assets.max_positive") :
                (new big(new_state.max_supply)).times(Math.pow(10, new_state.precision)).gt(GRAPHENE_MAX_SHARE_SUPPLY) ? counterpart.translate("account.user_issued_assets.too_large") :
                null;
        } catch(err) {
            console.log("err:", err);
            errors.max_supply = counterpart.translate("account.user_issued_assets.too_large");
        }

        let isValid = !errors.symbol && !errors.max_supply;

        this.setState({isValid: isValid, errors: errors});
    }

    _onFlagChange(key) {
        let booleans = this.state.flagBooleans;
        booleans[key] = !booleans[key];
        this.setState({
            flagBooleans: booleans
        });
    }

    _onPermissionChange(key) {
        let booleans = this.state.permissionBooleans;
        booleans[key] = !booleans[key];
        this.setState({
            permissionBooleans: booleans
        });
    }

    _onInputCoreAsset(type, asset) {

        if (type === "quote") {
            this.setState({
                quoteAssetInput: asset
            });
        } else if (type === "base") {
            this.setState({
                baseAssetInput: asset
            });
        }
    }

    _onFoundCoreAsset(type, asset) {
        if (asset) {
            let core_rate = this.state.core_exchange_rate;
            core_rate[type].asset_id = asset.get("id");

            this.setState({
                core_exchange_rate: core_rate
            });

            this._validateEditFields({
                max_supply: this.state.max_supply,
                core_exchange_rate: core_rate
            });
        }
    }

    _onInputMarket(asset) {

        this.setState({
            marketInput: asset
        });
    }

    _onFoundMarketAsset(asset) {
        if (asset) {
            this._onUpdateDescription("market", asset.get("symbol"));
        }
    }

    _onCoreRateChange(type, e) {
        let amount, asset;
        if (type === "quote") {
            amount = utils.limitByPrecision(e.target.value, this.state.update.precision);
            asset = null;
        } else {
            if (!e || !("amount" in e)) {
                return;
            }
            amount = e.amount == "" ? "0" : utils.limitByPrecision(e.amount.toString().replace(/,/g, ""), this.props.core.get("precision"));
            asset = e.asset.get("id");
        }

        let {core_exchange_rate} = this.state;
        core_exchange_rate[type] = {
            amount: amount,
            asset_id: asset
        };
        this.forceUpdate();
    }

    _onTogglePM() {
        this.state.update.precision = this.props.core.get("precision");
        this.state.core_exchange_rate.base.asset_id = this.props.core.get("id");
        this.forceUpdate();
    }

    render() {
        let {globalObject, core} = this.props;
        let {errors, isValid, update, flagBooleans, permissionBooleans,
            core_exchange_rate} = this.state;

        // Estimate the asset creation fee from the symbol character length
        let symbolLength = update.symbol.length, createFee = "N/A";

        if(symbolLength === 3) {
            createFee = <FormattedAsset amount={estimateFee("asset_create", ["symbol3"], globalObject)} asset={"1.3.0"} />;
        }
        else if(symbolLength === 4) {
            createFee = <FormattedAsset amount={estimateFee("asset_create", ["symbol4"], globalObject)} asset={"1.3.0"} />;
        }
        else if(symbolLength > 4) {
            createFee = <FormattedAsset amount={estimateFee("asset_create", ["long_symbol"], globalObject)} asset={"1.3.0"} />;
        }

        // Loop over flags
        let flags = [];
        let getFlag = (key, onClick, isChecked)=>{
            return <table key={"table_" + key} className="table">
                <tbody>
                    <tr>
                        <td style={{border: "none", width: "80%"}}><Translate content={`account.user_issued_assets.${key}`} />:</td>
                        <td style={{border: "none"}}>
                            <div className="switch" style={{marginBottom: "10px"}} onClick={onClick}>
                                <input type="checkbox" checked={isChecked} />
                                <label />
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>;
        };
        for (let key in permissionBooleans) {
            if (permissionBooleans[key] && key !== "charge_market_fee") {
                flags.push(
                    getFlag(
                        key,
                        this._onFlagChange.bind(this, key),
                        flagBooleans[key]
                    )
                );
            }
        }

        flags.push(
            getFlag(
                "visible",
                this._onUpdateDescription.bind(this, "visible"),
                update.description.visible ? false : (update.description.visible === false ? true : false)
            )
        );

        // Loop over permissions
        let permissions = [];
        for (let key in permissionBooleans) {
            permissions.push(
                <table key={"table_" + key} className="table">
                    <tbody>
                        <tr>
                            <td style={{border: "none", width: "80%"}}><Translate content={`account.user_issued_assets.${key}`} />:</td>
                            <td style={{border: "none"}}>
                                <div className="switch" style={{marginBottom: "10px"}} onClick={this._onPermissionChange.bind(this, key)}>
                                    <input type="checkbox" checked={permissionBooleans[key]} onChange={() => {}}/>
                                    <label />
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            );
        }

        const confirmButtons = (
            <div>
                <button className="button" onClick={this._reset.bind(this)} value={counterpart.translate("account.perm.reset")}>
                    <Translate content="account.perm.reset" />
                </button>
                <button className={classnames("button", {disabled: !isValid})} onClick={this._createAsset.bind(this)}>
                    <Translate content="header.create_asset" />
                </button>
            </div>
        );

        return (
            <div className="grid-content app-tables no-padding" ref="appTables">
                <div className="content-block small-12" style={{paddingTop:"34px"}}>
                    <Translate content="header.create_asset" component="h5" style={{fontWeight:"bold"}}/>
                    <div className="tabs-container generic-bordered-box">

                        <Tabs
                            setting="createAssetTab"
                            className="account-tabs"
                            tabsClass="account-overview no-padding bordered-header content-block"
                            contentClass="grid-block shrink small-vertical medium-horizontal padding"
                            segmented={false}
                            actionButtons={confirmButtons}>

                            <Tab title="account.user_issued_assets.primary">
                                <div className="small-12 grid-content">
                                    <label><Translate component="label" className="left-label" content="account.user_issued_assets.symbol" />
                                        <div className="flex-align-middle">
                                            <input type="text" style={{width:"600px"}} value={update.symbol} onChange={this._onUpdateInput.bind(this, "symbol")}/>
                                            <div style={{display:"flex",alignItems:"center",marginLeft:22,marginBottom:'1rem'}}>
                                                <svg className="icon" aria-hidden="true" style={{width:"18px",height:"18px",marginRight:"7px"}}>
                                                    <use xlinkHref="#icon-tishi3"></use>
                                                </svg>
                                                <Translate content="account.user_issued_assets.name_warning" style={{fontSize:"12px",color:"#FF972B"}}/>
                                            </div>
                                        </div>
                                    </label>
                                    { errors.symbol ? <p className="grid-content has-error">{errors.symbol}</p> : null}


                                    <Translate component="label" className="left-label" content="account.user_issued_assets.max_supply" /> {update.symbol ? <span>({update.symbol})</span> : null}
                                    <input type="text" style={{width:"600px"}} value={update.max_supply} onChange={this._onUpdateInput.bind(this, "max_supply")} />
                                    { errors.max_supply ? <p className="grid-content has-error">{errors.max_supply}</p> : null}
                                    <label className="left-label">
                                        <Translate content="account.user_issued_assets.decimals" />
                                        <span style={{fontSize:14,color:'#479F7D',marginLeft:35}}>{update.precision}</span>

                                        <div className="flex-align-middle" style={{marginTop:10}}>
                                            <input min="0" max="8" step="1" type="range" style={{width:"600px"}} value={update.precision} onChange={this._onUpdateInput.bind(this, "precision")} />
                                            <div style={{display:"flex",alignItems:"center",marginLeft:22}}>
                                                <svg className="icon" aria-hidden="true" style={{width:"18px",height:"18px",marginRight:"7px"}}>
                                                    <use xlinkHref="#icon-tishi3"></use>
                                                </svg>
                                                <Translate content="account.user_issued_assets.precision_warning" style={{fontSize:"12px",color:"#FF972B"}}/>
                                            </div>
                                        </div>
                                    </label>





                                    {null}

                                    {/* CER */}
                                    <br/><br/>

                                    <label>
                                        <Translate style={{color:"#333",marginBottom:40}} content="account.user_issued_assets.core_exchange_rate" />
                                    </label>

                                    <label>
                                        {errors.quote_asset ? <p className="grid-content has-error">{errors.quote_asset}</p> : null}
                                        {errors.base_asset ? <p className="grid-content has-error">{errors.base_asset}</p> : null}
                                        <div className="grid-block no-margin small-12 medium-6">
                                            <div className="amount-selector" style={{width: "100%", paddingRight: "10px"}}>
                                                <Translate component="label" className="left-label" content="account.user_issued_assets.quote"/>
                                                <input
                                                    type="text"
                                                    placeholder="0.0"
                                                    style={{width:"600px"}}
                                                    onChange={this._onCoreRateChange.bind(this, "quote")}
                                                    value={core_exchange_rate.quote.amount}
                                                />
                                            </div>
                                        </div>
                                        <br/><br/>
                                        <div className="flex-align-middle">
                                            <AmountSelector
                                                label="account.user_issued_assets.base"
                                                amount={core_exchange_rate.base.amount}
                                                onChange={this._onCoreRateChange.bind(this, "base")}
                                                asset={core_exchange_rate.base.asset_id}
                                                assets={[core_exchange_rate.base.asset_id]}
                                                placeholder="0.0"
                                                tabIndex={1}
                                                style={{width: 600}}
                                            />
                                        </div>
                                        <div>
                                            <div style={{fontSize:14,color:"#666",marginTop:34}}>
                                                <Translate content="exchange.price" />
                                                <span>: {utils.format_number(utils.get_asset_price(
                                                    core_exchange_rate.quote.amount * utils.get_asset_precision(update.precision),
                                                    {precision: update.precision},
                                                    core_exchange_rate.base.amount * utils.get_asset_precision(core),
                                                    core
                                                ), 2 + (parseInt(update.precision, 10) || 8))}</span>
                                                <span> {update.symbol}/{core.get("symbol")}</span>
                                            </div>
                                        </div>
                                    </label>
                                    <div style={{color:"#FF8C00",fontSize:14,marginTop:12}}>
                                        <div style={{display:"flex",alignItems:"center",marginBottom:10}}>
                                            <svg className="icon" aria-hidden="true" style={{width:"18px",height:"18px",marginRight:"7px"}}>
                                                <use xlinkHref="#icon-tishi3"></use>
                                            </svg>
                                            <Translate content="account.user_issued_assets.cer_warning_1" style={{fontSize:"14px",color:"#FF972B"}}/>
                                        </div>
                                        <Translate content="account.user_issued_assets.cer_warning_2" component="p" />
                                    </div>
                                    {<p style={{fontSize:14,color:"#666",marginTop:34}}><Translate content="account.user_issued_assets.approx_fee" />: {createFee}</p>}
                                </div>
                            </Tab>

                            <Tab title="account.user_issued_assets.description">
                                <div className="small-12 grid-content">
                                    <Translate component="label" content="account.user_issued_assets.description" />
                                    <label>
                                        <textarea
                                            style={{height: "7rem",width:"600px"}}
                                            rows="1"
                                            value={update.description.main}
                                            onChange={this._onUpdateDescription.bind(this, "main")}
                                        />
                                    </label>

                                    <Translate component="label" content="account.user_issued_assets.short"  style={{marginTop:30}}/>
                                    <label>
                                        <input
                                            type="text"
                                            rows="1"
                                            style={{width:"600px"}}
                                            value={update.description.short_name}
                                            onChange={this._onUpdateDescription.bind(this, "short_name")}
                                        />
                                    </label>

                                    <Translate component="label" content="account.user_issued_assets.market" style={{marginTop:30}}/>
                                        <AssetSelector
                                            label="account.user_issued_assets.name"
                                            onChange={this._onInputMarket.bind(this)}
                                            asset={this.state.marketInput}
                                            assetInput={this.state.marketInput}
                                            style={{width: "600px", paddingRight: "10px"}}
                                            onFound={this._onFoundMarketAsset.bind(this)}
                                        />

                                    { null}

                                </div>
                            </Tab>

                            {null}

                            <Tab title="account.permissions">
                                <div className="small-12 grid-content">
                                    <div style={{maxWidth: 800}}>
                                    <HelpContent
                                        path = {"components/AccountAssetCreate"}
                                        section="permissions"
                                    />
                                    </div>
                                    {permissions}
                                </div>
                            </Tab>

                            <Tab title="account.user_issued_assets.flags">
                                <div className="small-12 grid-content">
                                    {permissionBooleans["charge_market_fee"] ? (
                                        <div>
                                            <Translate content="account.user_issued_assets.flags" component="h5" style={{fontWeight:"bold"}}/>
                                            <div style={{maxWidth: 800}}>
                                                <HelpContent
                                                    path = {"components/AccountAssetCreate"}
                                                    section="flags"
                                                />
                                            </div>
                                            <table className="table">
                                                <tbody>
                                                    <tr>
                                                        <td style={{border: "none", width: "80%"}}><Translate content="account.user_issued_assets.charge_market_fee" />:</td>
                                                        <td style={{border: "none"}}>
                                                            <div className="switch" style={{marginBottom: "10px"}} onClick={this._onFlagChange.bind(this, "charge_market_fee")}>
                                                                <input type="checkbox" checked={flagBooleans.charge_market_fee} />
                                                                <label />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <div className={cnames({disabled: !flagBooleans.charge_market_fee})}>
                                            <label><Translate content="account.user_issued_assets.market_fee" /> (%)
                                                <input type="number"  style={{width:"600px"}} value={update.market_fee_percent} onChange={this._onUpdateInput.bind(this, "market_fee_percent")}/>
                                            </label>

                                            <label><Translate content="account.user_issued_assets.max_market_fee" /> ({update.symbol})
                                                <input type="number"  style={{width:"600px"}} value={update.max_market_fee} onChange={this._onUpdateInput.bind(this, "max_market_fee")}/>
                                            </label>
                                            { errors.max_market_fee ? <p className="grid-content has-error">{errors.max_market_fee}</p> : null}
                                            </div>
                                        </div>) : null}

                                    {flags}
                                </div>
                            </Tab>
                        </Tabs>
                    </div>
                </div>
            </div>
        );
    }

}

AccountAssetCreate = BindToChainState(AccountAssetCreate);

export {AccountAssetCreate};
