import React from "react";
//import BaseComponent from "../BaseComponent";
import {connect} from "alt-react";
import ERC20GatewayStore from "../../stores/gateway/ERC20GatewayStore";
import ERC20GatewayActions from "../../actions/gateway/ERC20GatewayActions";
import globalParams from "../../utils/GlobalParams";
import Validation from "../../utils/Validation";
import Utils from "../../utils/Utils";
import WalletUnlockActions from '../../actions/WalletUnlockActions';
//import TextLoading from "../Layout/TextLoading";
import NotificationActions from "../../actions/NotificationActions";
import QRCode from "qrcode.react";
//import Modal from "../Layout/Modal"
//import Example from "../../assets/img/example.png"
import counterpart from "counterpart";
import AccountStore from "stores/AccountStore";
import Modal from "../Modal/BaseModal";
import {ChainStore} from "seerjs/es";
import FormattedAsset from "../Utility/FormattedAsset";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import { Asset } from "common/MarketClasses";
import AccountActions from "actions/AccountActions";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Translate from "react-translate-component";
const gatewaySuppots =[
    "erc20.transfer_in_title",
    "erc20.transfer_out_title",
    "bts.transfer_in_title",
    "bts.transfer_out_title",
    "erc20.transfer_pfc_in_title",
    "erc20.transfer_pfc_out_title",
    "erc20.transfer_usdt_in_title",
    "erc20.transfer_usdt_out_title"
];

const network_fee_asset=[
    "1.3.0",
    "1.3.0",
    "1.3.0",
    "1.3.0",
    "1.3.2",
    "1.3.2",
    "1.3.5",
    "1.3.5"
];

const gateway_account =[
    "1.2.9981",
    "1.2.9981",
    "1.2.9981",
    "1.2.9981",
    "1.2.20339",
    "1.2.20339",
    "1.2.20340",
    "1.2.20340"
];

class ERC20Gateway extends React.Component {

    static propTypes = {
        currentAccount: ChainTypes.ChainAccount
    }
    static defaultProps = {
    };
    constructor() {
        super();
        this.state = this.__init();
    }
    __init(account_id) {

        return {
            curInx:0,
            modalIsShow:true,
            ethaddr:null,
            omniaddr:null,
            account:null,
            unit:'',
            from_name: null,
            to_name: "",
            amount: "",
            asset_id: null,
            asset: null,
            memo: "",
            error: null,
            network_fee_amount:0,
            address:'',
            account_bts:''
        }

    }
    componentDidMount() {
        this.changeUser(this.props.currentAccount);
    }

    changeUser(user) {
        if(user && AccountStore.isMyAccount(user) ){
            let self = this
            let id = user.get("id")

            ERC20GatewayActions.getOmniAddrByAccount({seer_account_id:user.get("id")}).then(function(res){
                self.setState({
                    omniaddr:res,account:id
                })
            })

            console.log(this.state.omniaddr,"  ",this.state.account,"  ",id,"  ")
            ERC20GatewayActions.getAddrByAccount({seer_account_id:user.get("id")}).then(function(res){
                self.setState({
                    ethaddr:res,account:id
                })
            })
        }
    }

    confirmTransfer(){
        this.setState({error: null});
        const {asset, amount, address, account_bts, curInx} = this.state;
        if (curInx != 3 && (!address || address === '') || curInx == 3 && (!account_bts || account_bts == '')) {
            ZfApi.publish("seer-out", "open");
            return;
        }
        const sendAmount = new Asset({real: amount, asset_id: this.state.asset_id, precision: 5});
        let from=this.props.currentAccount.get("id");

        AccountActions.transfer(
            from,
            gateway_account[this.state.curInx],
            sendAmount.getAmount(),
            this.state.asset_id,
            this.state.memo ? new Buffer(this.state.memo, "utf-8") : this.state.memo,
            null,
            "1.3.0"
        ).then( () => {
        }).catch( e => {
            let msg = e.message ? e.message.split( "\n" )[1] || e.message : null;
            console.log( "error: ", e, msg);
            this.setState({error: msg});
        } );
    }

    initGatewaySettings(idx){
        if(idx == this.state.curInx){
            return
        }

        this.setState({amount:"",address: "",account_bts:""});

        if(idx == 0){
            this.setState({curInx: idx});
            //this.setState({asset_id:"1.3.0",network_fee_amount:10,network_fee_asset:"1.3.0"});
        } else if(idx == 1){
            this.setState({curInx: idx,asset_id:"1.3.0",network_fee_amount:25000000,memo:"erc20#",unit:"SEER"});
        } else if(idx == 2){
            this.setState({curInx: idx});
            //this.setState({asset_id:"1.3.0",network_fee_amount:10,network_fee_asset:"1.3.0"});
        } else if(idx == 3){
            this.setState({curInx: idx,asset_id:"1.3.0",network_fee_amount:200000,memo:"bts#",unit:"SEER"});
        }else if(idx == 4){
            this.setState({curInx: idx});
        }else if(idx == 5){
            this.setState({curInx: idx,asset_id:"1.3.2",network_fee_amount:500000,memo:"erc20#",unit:"PFC"});
        }else if(idx == 6){
            this.setState({curInx: idx});
        }else if(idx == 7){
            this.setState({curInx: idx,asset_id:"1.3.5",network_fee_amount:500,memo:"omni#",unit:"USDT"});
        }
    }


    handleChangeTab(inx) {
        let indx = parseInt(inx.target.value);
        this.initGatewaySettings(indx);
    }

    closeQrcode() {
        this.setState({modalIsShow: false});
        console.log(this.state.modalIsShow)
    }

    showQrcode() {
        this.setState({modalIsShow: true});
        console.log(this.state.modalIsShow)
    }

    seerErc20Bind(){

        let account_name=this.props.currentAccount.get("name")
        let account_id=this.props.currentAccount.get("id")
        let ethaddr;

        let self=this
        ERC20GatewayActions.bindAccount({
            seer_account_id:account_id,
            seer_account_name:account_name
        }).then((res) => {
            self.setState({
                ethaddr:res
            })
        })

        ERC20GatewayActions.bindOmniAccount({
            seer_account_id:account_id,
            seer_account_name:account_name
        }).then((res) => {
            self.setState({
                omniaddr:res
            })
        })
    }

    handleAmountChange(e) {
        let {value} = e.target;
        let {balance} = this.props;
        this.setState({
            amount: value
        });
    }

    handleAddressChange(e) {
        if (this.state.curInx == 1){
            this.setState({address: e.target.value,memo:"erc20#"+e.target.value});
        } else if (this.state.curInx == 3){
            this.setState({account_bts: e.target.value,memo:"bts#"+e.target.value});
        } else if (this.state.curInx == 5){
            this.setState({address: e.target.value,memo:"erc20#"+e.target.value});
        }else if (this.state.curInx == 7){
            this.setState({address: e.target.value,memo:"omni#"+e.target.value});
        }
    }

    renderERC20SeerIn()
    {
        let from_error = null;
        let {propose, from_account, to_account, asset, asset_id, propose_account, feeAmount,
            amount, error, to_name, from_name, memo, feeAsset, fee_asset_id, balanceError ,ethaddr} = this.state;

        let {eth_address} = this.props;
        if(ethaddr == null || this.state.account != this.props.currentAccount.get("id")){

            this.changeUser(this.props.currentAccount);

        }

        return(
            <div data-title={counterpart.translate("erc20.transfer_in_title")}>
                <div className="m-t-20 balance-whitespace desc-text">{counterpart.translate("erc20.note")}</div>
                <br/>

                <div className="label-text">{counterpart.translate("erc20.current_account")}</div>
                <div><input type="text" style={{width:"600px"}} readOnly={true} className="erc-btn m-t-14" value={this.props.currentAccount.get("name")}/> </div> <br/>

                <div className="label-text">{counterpart.translate("erc20.bind_eth")}</div>
                {ethaddr == null || this.state.account != this.props.currentAccount.get("id")?
                    <button className="button" onClick={this.seerErc20Bind.bind(this)}>
                        <Translate content="erc20.btn_generate"/>
                    </button>
                    : (
                    <span>
                        <input type="text" readOnly={true} className="erc-btn text-center m-t-14" value={ethaddr}/>
                        <div className="layer-modal" display={ this.state.modalIsShow ? '' : 'none' }>
                            <div>
                                <h4>{counterpart.translate("erc20.qrcode")}</h4>
                                <dl>
                                    <dt>
                                        <span className="qrcode">
                                        <QRCode size={136} value={ethaddr} /></span>
                                    </dt>
                                </dl>
                            </div>
                        </div>
                    </span>
                )

                }
                <span className="mini_code"></span>
            </div>
        )
    }


    renderERC20SeerOut(){
        let {master, address,account_bts, amount, useCsaf} = this.state;
        let {wallet, ethaddr, balance, loading, fees} = this.props;

        let account_balances = this.props.currentAccount.get("balances").toJS();

        let account_balance;

        for (let key in account_balances) {
            if(key == this.state.asset_id)
            {
                let balanceObject = ChainStore.getObject(account_balances[key]);
                account_balance = balanceObject.get("balance");
                console.log(account_balance)
                break;
            }
        }

        return (
            <div data-title={counterpart.translate("erc20.transfer_out_title")}>
                <div className="m-t-12 desc-text">{counterpart.translate("erc20.transfer_out_note")}</div>
                <br/>
                <div className="label-text" style={{marginTop:"1em"}}>
                    <Translate content="erc20.transfer_out_to" />
                </div>
                <input type="text" placeholder={counterpart.translate("erc20.placeholder_out_address")}
                       className="w600 m-t-14 "  value={this.state.address} onChange={this.handleAddressChange.bind(this)}/><br/>
                <div className="label-text">
                    <Translate content="erc20.transfer_out_amount" />
                </div>
                <input type="text"
                       placeholder={counterpart.translate("erc20.placeholder_out_amount", {unit: this.state.unit})}
                       className="w600 m-t-14"
                       value={amount}
                       onChange={this.handleAmountChange.bind(this)}/>

                <div className="desc-text">
                    <Translate content="erc20.useable" />
                    <FormattedAsset amount={account_balance} asset={this.state.asset_id}/>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    <Translate content="erc20.fees" />
                    <FormattedAsset amount={this.state.network_fee_amount} asset={network_fee_asset[this.state.curInx]}/>
                    <br/>
                    <Translate content="erc20.confirm_note" />
                    <FormattedAsset amount={this.state.network_fee_amount} asset={network_fee_asset[this.state.curInx]}/>
                    <br/><br/>
                </div>

                <br/><br/>
                {loading ? <TextLoading/> :
                    <button className="button large" onClick={this.confirmTransfer.bind(this)}>
                        <Translate content="erc20.confirm_btn" />
                    </button>
                }

            </div>
        )
    }

    renderBTSIn(){
        let {master, address,account_bts, amount, useCsaf} = this.state;
        let {wallet, ethaddr, balance, loading, fees} = this.props;
        return (
            <div  data-title={counterpart.translate("bts.transfer_in_title")} >
                <div className="m-t-20 desc-text">
                    <Translate content="bts.note_info" />
                    <Translate content="bts.note" component="div"/>
                </div>

                <br/><br/>
                <img className="balance-bisin-img" src={require('../../assets/bts_gateway_example.png')} alt=''/>
            </div>
        )
    }

    renderBTSOut(){
        let {master, address,account_bts, amount, useCsaf} = this.state;
        let {wallet, ethaddr, balance, loading, fees} = this.props;

        let account_balances = this.props.currentAccount.get("balances").toJS();

        let account_balance;

        for (let key in account_balances) {
            if(key == this.state.asset_id)
            {
                let balanceObject = ChainStore.getObject(account_balances[key]);
                account_balance = balanceObject.get("balance");
                console.log(account_balance)
                break;
            }
        }
        return (
            <div data-title={counterpart.translate("bts.transfer_out_title")} >
                <div className="m-t-20 desc-text">
                    <Translate content="bts.transfer_out_note" />
                </div>
                <br/> <br/>
                <div className="label-text"> <Translate content="bts.transfer_out_to" /></div>
                <input type="text" className="w600 m-t-14" placeholder={counterpart.translate("bts.placeholder_out_address")}  value={account_bts} onChange={this.handleAddressChange.bind(this)}/>
                <br/><br/>
                <div className="label-text"><Translate content="bts.transfer_out_amount" /></div>
                <input type="text"
                       placeholder={counterpart.translate("bts.placeholder_out_amount", {unit: this.state.unit})}
                       className="w600 m-t-14 "
                       value={amount}
                       onChange={this.handleAmountChange.bind(this)}/>

                <div className="desc-text">
                    <Translate content="bts.useable" />
                    <FormattedAsset amount={account_balance} asset={this.state.asset_id}/>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    <Translate content="bts.fees" />
                    <FormattedAsset amount={this.state.network_fee_amount} asset={network_fee_asset[this.state.curInx]}/>
                    <br/>
                    <Translate content="bts.confirm_note" />
                    <FormattedAsset amount={this.state.network_fee_amount} asset={network_fee_asset[this.state.curInx]}/>
                </div>
                <br/><br/>
                {loading ? <TextLoading/> :
                    <button className="button large" onClick={this.confirmTransfer.bind(this)}>
                        <Translate content="bts.confirm_btn" />
                    </button>
                }
            </div>
        )
    }


    renderERC20PFCIn()
    {
        let from_error = null;
        let {propose, from_account, to_account, asset, asset_id, propose_account, feeAmount,
            amount, error, to_name, from_name, memo, feeAsset, fee_asset_id, balanceError ,ethaddr} = this.state;

        let {eth_address} = this.props;
        if(ethaddr == null || this.state.account != this.props.currentAccount.get("id")){
            this.changeUser(this.props.currentAccount);
        }

        return(
            <div data-title={counterpart.translate("erc20.transfer_in_title")}>
                <div className="m-t-20 desc-text">
                    <Translate content="erc20.note_pfc" />
                </div>
                <br/> <br/>

                <div className="label-text">{counterpart.translate("erc20.current_account")}</div>
                <div><input type="text" style={{width:"600px"}} readOnly={true} className="erc-btn m-t-14" value={this.props.currentAccount.get("name")}/> </div> <br/>


                <div className="label-text">{counterpart.translate("erc20.bind_eth")}</div>
                {ethaddr == null || this.state.account != this.props.currentAccount.get("id")?
                    <button className="button" onClick={this.seerErc20Bind.bind(this)}>
                        <Translate content="erc20.btn_generate"/>
                    </button>
                    : (
                    <span>
                        <input type="text" readOnly={true} className="erc-btn text-center m-t-14" value={ethaddr}/>
                        <div className="layer-modal" display={ this.state.modalIsShow ? '' : 'none' }>
                            <div>
                                <h4>{counterpart.translate("erc20.qrcode")}</h4>
                                <dl>
                                    <dt>
                                        <span className="qrcode">
                                        <QRCode size={136} value={ethaddr} /></span>
                                    </dt>
                                </dl>
                            </div>
                        </div>
                    </span>
                )

                }
                <span className="mini_code"></span>
            </div>
        )
    }


    renderERC20PFCOut(){
        let {master, address,account_bts, amount} = this.state;
        let {wallet, ethaddr, balance, loading, fees} = this.props;

        let account_balances = this.props.currentAccount.get("balances").toJS();

        let account_balance;

        for (let key in account_balances) {
            if(key == this.state.asset_id)
            {
                let balanceObject = ChainStore.getObject(account_balances[key]);
                account_balance = balanceObject.get("balance");
                console.log(account_balance)
                break;
            }
        }

        return (
            <div data-title={counterpart.translate("erc20.transfer_out_title")}>

                <div className="m-t-20 desc-text">
                    <Translate content="erc20.transfer_out_note" />
                </div>
                <br/> <br/>

                <div className="label-text"> <Translate content="erc20.transfer_out_to" /></div>
                <input type="text" className="w600 m-t-14" placeholder={counterpart.translate("erc20.placeholder_out_address")}  value={this.state.address}  onChange={this.handleAddressChange.bind(this)}/>
                <br/><br/>


                <div className="label-text"><Translate content="erc20.transfer_out_amount" /></div>
                <input type="text"
                       placeholder={counterpart.translate("erc20.placeholder_out_amount", {unit: this.state.unit})}
                       className="w600 m-t-14 "
                       value={amount}
                       onChange={this.handleAmountChange.bind(this)}/>

                <div className="desc-text">
                    <Translate content="erc20.useable" />
                    <FormattedAsset amount={account_balance} asset={this.state.asset_id}/>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    <Translate content="erc20.fees" />
                    <FormattedAsset amount={this.state.network_fee_amount} asset={network_fee_asset[this.state.curInx]}/>
                    <br/>
                    <Translate content="erc20.confirm_note" />
                    <FormattedAsset amount={this.state.network_fee_amount} asset={network_fee_asset[this.state.curInx]}/>
                </div>
                <br/><br/>

                {loading ? <TextLoading/> :
                    <button className="button large" onClick={this.confirmTransfer.bind(this)}>
                        <Translate content="erc20.confirm_btn" />
                    </button>
                }
            </div>
        )
    }

    //usdt
    renderOmniUSDTIn()
    {
        let from_error = null;
        let {propose, from_account, to_account, asset, asset_id, propose_account, feeAmount,
            amount, error, to_name, from_name, memo, feeAsset, fee_asset_id, balanceError ,omniaddr} = this.state;

        let {eth_address} = this.props;
        if(omniaddr == null || this.state.account != this.props.currentAccount.get("id")){
            this.changeUser(this.props.currentAccount);
        }

        return(
            <div data-title={counterpart.translate("erc20.transfer_in_title")}>
                <div className="m-t-20 desc-text">
                    <Translate content="erc20.note_usdt" />
                </div>
                <br/> <br/>

                <div className="label-text">{counterpart.translate("erc20.current_account")}</div>
                <div><input type="text" style={{width:"600px"}} readOnly={true} className="erc-btn m-t-14" value={this.props.currentAccount.get("name")}/> </div> <br/>


                <div className="label-text">{counterpart.translate("erc20.bind_omni")}</div>
                {omniaddr == null || this.state.account != this.props.currentAccount.get("id")?
                    <button className="button" onClick={this.seerErc20Bind.bind(this)}>
                        <Translate content="erc20.btn_generate"/>
                    </button>
                    : (
                    <span>
                        <input type="text" readOnly={true} className="erc-btn text-center m-t-14" value={omniaddr}/>
                        <div className="layer-modal" display={ this.state.modalIsShow ? '' : 'none' }>
                            <div>
                                <h4>{counterpart.translate("erc20.omniqrcode")}</h4>
                                <dl>
                                    <dt>
                                        <span className="qrcode">
                                        <QRCode size={136} value={omniaddr} /></span>
                                    </dt>
                                </dl>
                            </div>
                        </div>
                    </span>
                )

                }
                <span className="mini_code"></span>
            </div>
        )
    }


    renderOmniUSDTOut(){
        let {master, address,account_bts, amount} = this.state;
        let {wallet, omniaddr, balance, loading, fees} = this.props;

        let account_balances = this.props.currentAccount.get("balances").toJS();

        let account_balance;

        for (let key in account_balances) {
            if(key == this.state.asset_id)
            {
                let balanceObject = ChainStore.getObject(account_balances[key]);
                account_balance = balanceObject.get("balance");
                console.log(account_balance)
                break;
            }
        }

        return (
            <div data-title={counterpart.translate("erc20.transfer_out_title")}>
                <div className="m-t-20 desc-text">
                    <Translate content="erc20.transfer_out_omninote" />
                </div>
                <br/> <br/>

                <div className="label-text"> <Translate content="erc20.transfer_out_to" /></div>
                <input type="text" className="w600 m-t-14" placeholder={counterpart.translate("erc20.placeholder_out_omniaddress")}  value={this.state.address}  onChange={this.handleAddressChange.bind(this)}/>
                <br/><br/>

                <div className="label-text"><Translate content="erc20.transfer_out_amount" /></div>
                <input type="text"
                       placeholder={counterpart.translate("erc20.placeholder_out_amount", {unit: this.state.unit})}
                       className="w600 m-t-14 "
                       value={amount}
                       onChange={this.handleAmountChange.bind(this)}/>

                <div className="desc-text">
                    <Translate content="erc20.useable" />
                    <FormattedAsset amount={account_balance} asset={this.state.asset_id}/>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    <Translate content="erc20.fees" />
                    <FormattedAsset amount={this.state.network_fee_amount} asset={network_fee_asset[this.state.curInx]}/>
                    <br/>
                    <Translate content="erc20.confirm_note" />
                    <FormattedAsset amount={this.state.network_fee_amount} asset={network_fee_asset[this.state.curInx]}/>
                </div>
                <br/><br/>

                {loading ? <TextLoading/> :
                    <button className="button large" onClick={this.confirmTransfer.bind(this)}>
                        <Translate content="erc20.confirm_btn" />
                    </button>
                }
            </div>
        )
    }

    render() {
        if(!this.props.currentAccount){
            return(
                <div className="balance-body">
                    <h3>{counterpart.translate("erc20.title")}</h3>
                    <br/>
                    <div>{counterpart.translate("account.errors.unknown")}</div>
                </div>
            );
        }

        let content = null;
        if(!AccountStore.isMyAccount(this.props.currentAccount)) {
            content = (
                <div className="balance-body">
                    <h3>{counterpart.translate("erc20.title")}</h3>
                    <br/>
                    <div>{this.props.currentAccount.get("name")}{counterpart.translate("account.errors.not_yours")}</div>
                </div>
            );
        }

        let detail ;
        if(this.state.curInx == 0){
            detail =  this.renderERC20SeerIn();
        }else if(this.state.curInx == 1){
            detail = this.renderERC20SeerOut();
        } else if(this.state.curInx == 2){
            detail = this.renderBTSIn();
        } else if(this.state.curInx == 3){
            detail = this.renderBTSOut();
        }else if(this.state.curInx == 4){
            detail = this.renderERC20PFCIn();
        }else if(this.state.curInx == 5){
            detail = this.renderERC20PFCOut();
        }else if(this.state.curInx == 6){
            detail = this.renderOmniUSDTIn();
        }else if(this.state.curInx == 7){
            detail = this.renderOmniUSDTOut();
        }

        let type_options=[];

        gatewaySuppots.forEach( (item,index) => {
            type_options.push(<option key={index} value={index}>{counterpart.translate(item)}</option>)
        });



        content = (
            <div className="balance-body" style={{marginTop:"48px"}}>
                <Modal
                    id='seer-out'
                    overlay = {true}
                >
                    {counterpart.translate("erc20.to_require")}
                </Modal>
                <select className="balance-select bts-select" style={{width:"600px"}} value={this.state.curInx} onChange={this.handleChangeTab.bind(this)}>
                    {type_options}
                </select>
                {detail}
            </div>
        );

        return (
            <div className="grid-content app-tables no-padding" ref="appTables">
                <div className="content-block small-12" style={{paddingTop:"34px"}}>
                    <Translate content="erc20.title" component="h5" style={{fontWeight:"bold"}}/>
                    {content}
                </div>
            </div>
        );
    }
}

ERC20Gateway=BindToChainState(ERC20Gateway)
// check if is there any other store
export default connect(ERC20Gateway, {
    listenTo() {
        return [AccountStore,ERC20GatewayStore];
    },
    getProps() {
        let result={}
        result["currentAccount"]=AccountStore.getState().currentAccount

        for (let props in ERC20GatewayStore.getState()) {
            result[props] = ERC20GatewayStore.getState()[props];
        }
        return result
    }
});