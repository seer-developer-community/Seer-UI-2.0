import React from "react";
import {PropTypes} from "react";
import Translate from "react-translate-component";
import FormattedAsset from "../Utility/FormattedAsset";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import BindToChainState from "../Utility/BindToChainState";
import {Tabs, Tab} from "../Utility/Tabs";
import {Apis} from "seerjs-ws";
import {ChainStore} from "seerjs";
import ChainTypes from "../Utility/ChainTypes";
import TimeAgo from "../Utility/TimeAgo";
import WitnessActions from "../../actions/WitnessActions";
import BaseModal from "../Modal/BaseModal";
import counterpart from "counterpart";
import AmountSelector from "../Utility/AmountSelector";
import {Link} from "react-router/es";
import WalletDb from "../../stores/WalletDb";
import WalletUnlockActions from "actions/WalletUnlockActions";
import PrivateKey from "seerjs/es/ecc/src/PrivateKey";
import ReserveAssetModal from "../Modal/ReserveAssetModal";

class CollateralList extends React.Component {
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
                <td>{r.id}</td>
                <td>{r.start}</td>
                <td><FormattedAsset amount={r.amount} asset="1.3.0" decimalOffset={5} /></td>
                <td>{r.expiration}</td>
                <td>
                    {
                        r.status
                        ? now > new Date(r.expiration).valueOf()
                            ? <Translate content="account.witness.collateral.unfrozen"/>
                            : <Translate content="account.witness.collateral.unfreezing"/>
                        : <Translate content="account.witness.collateral.frozen"/>
                    }
                </td>
                <td>
                    {
                        r.status
                        ? <button onClick={this.claimCollateral.bind(this, r.owner, r.id)} className={`button ${now > new Date(r.expiration).valueOf() ? '' : 'disabled'}`}><Translate content="account.witness.collateral.claim"/></button>
                        : <button onClick={this.cancelCollateral.bind(this, r.owner, r.id)} className="button"><Translate content="account.witness.collateral.cancel"/></button>
                    }
                </td>
            </tr>)
        return (
            <table className="table dashboard-table table-hover">
                <thead>
                <tr style={{height:"3em"}}>
                    <th style={{background:"#F8F8FA"}}>ID</th>
                    <th style={{background:"#F8F8FA"}}><Translate content="account.witness.collateral.date"/></th>
                    <th style={{background:"#F8F8FA"}}><Translate content="account.witness.collateral.amount"/></th>
                    <th style={{background:"#F8F8FA"}}><Translate content="account.witness.collateral.expiration"/></th>
                    <th style={{background:"#F8F8FA"}}><Translate content="account.witness.collateral.status"/></th>
                    <th style={{background:"#F8F8FA"}}><Translate content="account.witness.collateral.operation"/></th>
                </tr>
                </thead>
                <tbody>
                    {collateralRows}
                </tbody>
            </table>
        )
    }
}
class AccountWitness extends React.Component {

    // static defaultProps = {
    //     dynGlobalObject: '2.1.0',
    //     globalObject: "2.0.0",
    //
    // };
    //
    // static propTypes = {
    //     dynGlobalObject: ChainTypes.ChainObject.isRequired,
    //     globalObject: ChainTypes.ChainObject.isRequired,
    // };

    constructor(props) {
        super(props);
        this.state = {
            witness: null,
            collateralAmount: "0",
            signingKey: "",
            witnessUrl: "",
            viewStatus:null,
            generateKeys:""
        };
        this.update = this.update.bind(this);
    }
    componentWillMount() {
        ChainStore.subscribe(this.update);
        this.update(this.props.account);
    }

    componentWillReceiveProps(nextProps) {
      if(nextProps.account !== this.props.account || nextProps.account_name !== this.props.account_name){
        this.update(nextProps.account);
      }
    }

    componentWillUnmount() {
        ChainStore.unsubscribe(this.update);
    }

    update(account) {
        account = account || this.props.account;
        let witness = ChainStore.getWitnessById(account.get("id"));
        this.setState({
          witness: witness ? witness.toJS() : null
        });
    }

    openCreateCollateralModal() {
        ZfApi.publish("witness_create_collateral", "open");
    }
    closeCreateCollateralModal() {
        ZfApi.publish("witness_create_collateral", "close");
    }
    createCollateral(id) {
        var args = {
            witness: id,
            witness_account:  this.props.account.get("id"),
            amount: this.state.collateralAmount * 100000,
        };
        WitnessActions.createCollateral(args);
        this.closeCreateCollateralModal();
    }

    openWitnessUpdateModal() {
        ZfApi.publish("witness_update", "open");
    }
    closeWitnessUpdateModal() {
        ZfApi.publish("witness_update", "close");
    }
    updateWitness(id) {
        var args = {
            witness: id,
            witness_account:  this.props.account.get("id"),
            new_url: this.state.witnessUrl,
            new_signing_key: this.state.signingKey,
        };
        WitnessActions.update(args);
        this.closeWitnessUpdateModal();
    }

    createWitness() {
        var args = {
            witness_account:  this.props.account.get("id"),
            url: this.state.witnessUrl,
            block_signing_key: this.state.signingKey,
        };
        WitnessActions.create(args);
    }

    claimProfit(witnessId) {
        var args = {
            witness: witnessId,
            witness_account: this.props.account.get("id")
        };
        WitnessActions.claimCollateral(args);
    }

    generateKeys(){
          WalletUnlockActions.unlock().then(e=>{
            let brainKey = WalletDb.getRandomBrainKey();
            let private_key = PrivateKey.fromSeed(brainKey);
            let wif = private_key.toWif();
            let publicKey = private_key.toPublicKey().toPublicKeyString();

            let keys = {
              brain_priv_key:brainKey,
              wif_priv_key:wif,
              pub_key:publicKey
            };

            this.setState({generateKeys: `"brain_priv_key":"${keys.brain_priv_key}",\n"wif_priv_key":"${keys.wif_priv_key}",\n"pub_key":"${keys.pub_key}"`});
            ZfApi.publish("show_keys", "open");
        });
    }

    render() {
        const {
            // dynGlobalObject, globalObject,
            account_name } = this.props;
        let witness = this.state.witness,
            isLifetimeMember = this.props.account.get("id") === this.props.account.get("lifetime_referrer"),
            children;
        if (witness) {
            // let last_aslot_time = new Date(Date.now() - ((dynGlobalObject.get("current_aslot") - witness.last_aslot ) * globalObject.getIn( ["parameters","block_interval"] )*1000));
            children = (<div className="card-content">
                <table className="table key-value-table" style={{width: "100%"}}>
                    <tbody>
                        <tr>
                            <td><Translate content="explorer.witnesses.total_collateral" /></td>
                            <td><FormattedAsset amount={witness.total_collateral} asset="1.3.0" decimalOffset={5} /></td>
                        </tr>
                        <tr>
                            <td><Translate content="explorer.witnesses.missed" /></td>
                            <td>{witness.total_missed}</td>
                        </tr>
                        {
                            // <tr>
                            //     <td><Translate content="explorer.blocks.last_block" /></td>
                            //     <td><TimeAgo time={new Date(last_aslot_time)} /></td>
                            // </tr>
                            <tr>
                                <td>URL</td>
                                <td>{witness.url}</td>
                            </tr>
                        }
                        <tr>
                            <td><Translate content="account.witness.signing_key" /></td>
                            <td>{witness.signing_key}</td>
                        </tr>
                        <tr>
                            <td><Translate content="explorer.witnesses.collateral_profit" /></td>
                            <td>
                                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                                    <FormattedAsset amount={witness.collateral_profit} asset="1.3.0" decimalOffset={5} />
                                    <button onClick={this.claimProfit.bind(this, witness.id)} className="button small" ><Translate content="account.witness.collateral.claim"/></button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <br/>
                <div className="content-block">
                    <button className="button large" onClick={this.openWitnessUpdateModal} style={{marginTop:"2em",marginBottom:"2em"}}><Translate content="account.witness.update" /></button>
                </div>


                <CollateralList witnessId={witness.id} collaterals={witness.collaterals}/>
                <br/>
                <div className="content-block">
                    <button className="button large" onClick={this.openCreateCollateralModal} style={{marginTop:"2em"}}><Translate content="account.witness.collateral.create" /></button>
                </div>


                <BaseModal id="witness_create_collateral" overlay={true}>
                    <h5><Translate content="account.witness.collateral.create" /></h5>
                    <div className="grid-container " style={{paddingTop: "2rem"}}>
                        <AmountSelector
                            label="account.witness.collateral.amount"
                            amount={this.state.collateralAmount}
                            onChange={(v) => this.setState({collateralAmount: v.amount})}
                            asset="1.3.0"
                            assets={["1.3.0"]}
                        />
                        <br/>
                        <div className="content-block button-group">
                            <button className="button" onClick={this.createCollateral.bind(this, witness.id)}>{counterpart.translate("submit")}</button>
                            <button className="button" onClick={this.closeCreateCollateralModal}>{counterpart.translate("cancel")}</button>
                        </div>
                    </div>
                </BaseModal>
                <BaseModal id="witness_update" overlay={true}>
                    <h5><Translate content="account.witness.update"/></h5>
                    <div className="grid-container " style={{paddingTop: "2rem"}}>
                        <label>
                            <span><Translate content="account.witness.signing_key"/></span>
                            <input
                                type='text'
                                value={this.state.signingKey}
                                onChange={(e) => this.setState({signingKey: e.target.value})}
                             />
                        </label>
                        {
                            <label>
                                <span>URL</span>
                                 <input
                                     type='text'
                                     value={this.state.witnessUrl}
                                     onChange={(e) => this.setState({witnessUrl: e.target.value})}
                                  />
                            </label>
                        }
                        <br/>
                        <div className="content-block button-group">
                            <button className="button" onClick={this.updateWitness.bind(this, witness.id)}>{counterpart.translate("submit")}</button>
                            <button className="button" onClick={this.closeWitnessUpdateModal}>{counterpart.translate("cancel")}</button>
                        </div>
                    </div>
                </BaseModal>
            </div>)
        } else {
            if(this.state.viewStatus === "witness_create"){
                children = (
                  <div>
                    <div>
                      <button onClick={this.generateKeys.bind(this)} className="button outline" style={{margin:"20px 0px"}}>
                        <Translate content="account.witness.generate_keys"/>
                      </button>
                    </div>
                    <div className="content-block">
                      <Translate component="label" content="account.witness.signing_key"/>
                      <textarea onChange={(e) => this.setState({signingKey: e.target.value})} style={{height:"6.69em",resize: "none",color:"#666",fontSize:14,lineHeight:"22px"}} value={this.state.signingKey}></textarea>
                    </div>

                    <div className="content-block">
                      <label>URL</label>
                      <input
                        type='text'
                        value={this.state.witnessUrl}
                        onChange={(e) => this.setState({witnessUrl: e.target.value})}
                      />
                    </div>

                    <button onClick={this.createWitness.bind(this)} className="button primary" style={{marginTop:"48px"}}>
                      <Translate content="account.witness.create"/>
                    </button>
                  </div>
                );
            }else{
              children = (<div className="content-block">
                <div className="content-block" style={{textAlign:"center",marginTop:"8em"}}>
                  <svg className="icon" aria-hidden="true" style={{width:"5.19em",height:"4.35em",marginBottom:"10px"}}>
                    <use xlinkHref="#icon-zanwujilu1-copy"></use>
                  </svg>
                  <p>
                    <Translate content="account.witness.not_created" style={{fontSize:"14px",color:"#999999"}}/>
                    {!isLifetimeMember && <Link to={`/account/${account_name}/member-stats`} style={{fontSize:"14px"}}><Translate content="account.witness.not_lifetime_member"/></Link>}
                  </p>
                  <br/>
                  <button className={`button  primary ${isLifetimeMember ? '' : 'disabled'}`} onClick={e=>this.setState({viewStatus:"witness_create"})}><Translate content="account.witness.create" /></button>
                </div>
              </div>)
            }
        }

        return (
            <div className="grid-content app-tables no-padding" ref="appTables">
              <div className="content-block small-12" style={{paddingTop:"34px"}}>
                <Translate content="account.witness.title" component="h5" style={{fontWeight:"bold"}}/>
                <Translate content="account.witness.explain" component="p" style={{fontSize:"14px",color:"#999",marginBottom:"0.5em"}}/>
                <Link to={"https://docs.seerchain.org/#/zh-Hans/witness?id=%E6%9C%8D%E5%8A%A1%E5%99%A8%E7%AB%AF%E6%93%8D%E4%BD%9C"} target="_blank" style={{fontSize:"14px"}}> <Translate content="account.witness.tips"/></Link>
                <div style={{marginTop:"48px"}}>
                  {children}
                </div>
                </div>
              <BaseModal id="show_keys" overlay={true}>
                <br/><br/>
                <div className="grid-block vertical">
                  <textarea style={{height:"9em",resize: "none",color:"#666",fontSize:14,lineHeight:"22px"}} value={this.state.generateKeys}></textarea>
                </div>
              </BaseModal>
            </div>
        );
    }
}

AccountWitness = BindToChainState(AccountWitness);

export default AccountWitness;
