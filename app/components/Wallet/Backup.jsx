import React, {PropTypes, Component} from "react";
import {Link} from "react-router/es";
import {FormattedDate} from "react-intl";
import { connect } from "alt-react";
import WalletActions from "actions/WalletActions";
import WalletManagerStore from "stores/WalletManagerStore";
import BackupStore from "stores/BackupStore";
import WalletDb from "stores/WalletDb";
import BackupActions, {backup, decryptWalletBackup} from "actions/BackupActions";
import notify from "actions/NotificationActions";
import {saveAs} from "file-saver";
import cname from "classnames";
import Translate from "react-translate-component";
import {ChainConfig} from "seerjs-ws";
import {PrivateKey} from "seerjs/es";
import SettingsActions from "actions/SettingsActions";
import counterpart from "counterpart";

const connectObject = {
    listenTo() {
        return [WalletManagerStore, BackupStore];
    },
    getProps() {
        let wallet = WalletManagerStore.getState();
        let backup = BackupStore.getState();
        return { wallet, backup };
    }
};

//The default component is WalletManager.jsx
class BackupCreate extends Component {

    constructor() {
      super();
      this.state = {
        agreeDown: false
      }
    }

    render() {
        if(!this.props.inRegister) {
          return (
            <div style={{ maxWidth: "40rem" }}>
              <Create noText={this.props.noText}
                      newAccount={this.props.location ? this.props.location.query.newAccount : null}>
                <NameSizeModified/>
                {this.props.noText ? null : <Sha1/>}
                <Download downloadCb={this.props.downloadCb}/>
              </Create>
            </div>
          );
        }else{

          let className = "";
          if(!this.state.agreeDown){
            className = "disabled";
          }

            return (
              <div style={{ maxWidth: "40rem",textAlign:"left" }}>
                <Create noText={this.props.noText} inRegister={this.props.inRegister}
                        newAccount={this.props.location ? this.props.location.query.newAccount : null}>
                  <NameSizeModified inRegister={this.props.inRegister}/>
                  <Download downloadCb={this.props.downloadCb} cname={className} style={{width:"31.25em",height:"3.13em",marginBottom:"2em"}}/>
                  <Sha1/>
                  <div style={{display:"flex",margin:"2em 0 20em 0"}}>
                    <input className="cbox" id="ck_agree" type="checkbox" onChange={e=>this.setState({agreeDown: !this.state.agreeDown})}/>
                    <label className="checkbox-mask" htmlFor="ck_agree" style={{width:"24px",position:"relative",top:"4px"}}></label>
                    <Translate component="p" unsafe content="wallet.download_bin_agree_text" style={{fontSize:"14px",color:"#999"}}/>
                  </div>
                </Create>
              </div>
            );
        }
    }
}
BackupCreate = connect(BackupCreate, connectObject);

// layout is a small project
// class WalletObjectInspector extends Component {
//     static propTypes={ walletObject: PropTypes.object }
//     render() {
//         return <div style={{overflowY:'auto'}}>
//             <Inspector
//                 data={ this.props.walletObject || {} }
//                 search={false}/>
//         </div>
//     }
// }

class BackupRestore extends Component {

    constructor() {
        super()
        this.state = {
            newWalletName: null
        }
    }

    componentWillMount() {
        BackupActions.reset();
    }

    render() {
        let new_wallet = this.props.wallet.new_wallet
        let has_new_wallet = this.props.wallet.wallet_names.has(new_wallet)
        let restored = has_new_wallet

        if(this.props.inRegister) {
          return (
            <div>
              <Upload2 />
            </div>
          );
        }else{
          return (
            <div>
              <Translate style={{ textAlign: "left", maxWidth: "37.5rem", fontSize: "14px", color: "#999" }}
                         component="p" content="wallet.import_backup_choose"/>
              {(new FileReader).readAsBinaryString ? null :
                <p className="error">Warning! You browser doesn't support some some file operations required to restore
                  backup, we recommend you to use Chrome or Firefox browsers to restore your backup.</p>}
              <Upload>
                <NameSizeModified/>
                <DecryptBackup saveWalletObject={true}>
                  <NewWalletName>
                    <Restore/>
                  </NewWalletName>
                </DecryptBackup>
              </Upload>
              {/*<br />*/}
              {/*<Link to="/"><button className="blue"><Translate content="wallet.back" /></button></Link>*/}
            </div>
          );
        }
    }
}

BackupRestore = connect(BackupRestore, connectObject);

class Restore extends Component {

    constructor() {
        super()
        this.state = { }
    }

    isRestored() {
        let new_wallet = this.props.wallet.new_wallet;
        let has_new_wallet = this.props.wallet.wallet_names.has(new_wallet);
        return has_new_wallet;
    }

    render() {
        let new_wallet = this.props.wallet.new_wallet
        let has_new_wallet = this.isRestored()

        if(has_new_wallet)
            return <span>
                <h5><Translate content="wallet.restore_success" name={new_wallet.toUpperCase()} /></h5>
                <Link to="/dashboard">
                    <div className="button outline">
                        <Translate component="span" content="header.dashboard" />
                    </div>
                </Link>
                <div>{this.props.children}</div>
            </span>

        return <span>
            <h3><Translate content="wallet.ready_to_restore" /></h3>
            <div className="button outline"
                onClick={this.onRestore.bind(this)}><Translate content="wallet.restore_wallet_of" name={new_wallet} /></div>
        </span>
    }

    onRestore() {
        WalletActions.restore(
            this.props.wallet.new_wallet,
            this.props.backup.wallet_object
        );
        SettingsActions.changeSetting({
            setting: "passwordLogin",
            value: false
        });
    }

}
Restore = connect(Restore, connectObject);

class NewWalletName extends Component {

    constructor() {
        super()
        this.state = {
            new_wallet: null,
            accept: false
        }
    }

    componentWillMount() {
        let has_current_wallet = !!this.props.wallet.current_wallet
        if( ! has_current_wallet) {
            let walletName = "default";
            if (this.props.backup.name) {
                walletName = this.props.backup.name.match(/[a-z0-9_-]*/)[0]
            }
            WalletManagerStore.setNewWallet(walletName)
            this.setState({accept: true})
        }
        if( has_current_wallet && this.props.backup.name && ! this.state.new_wallet) {
            // begning of the file name might make a good wallet name
            let new_wallet = this.props.backup.name.toLowerCase().match(/[a-z0-9_-]*/)[0];
            if( new_wallet )
                this.setState({new_wallet})
        }
    }

    render() {
        if(this.state.accept)
            return <span>{this.props.children}</span>

        let has_wallet_name = !!this.state.new_wallet
        let has_wallet_name_conflict = has_wallet_name ?
            this.props.wallet.wallet_names.has(this.state.new_wallet) : false
        let name_ready = ! has_wallet_name_conflict && has_wallet_name

        return (
        <form onSubmit={this.onAccept.bind(this)}>
            <h5><Translate content="wallet.new_wallet_name" /></h5>
            <input
                type="text"
                id="new_wallet"
                onChange={this.formChange.bind(this)}
                value={this.state.new_wallet}
            />
            <p>{ has_wallet_name_conflict ? <Translate content="wallet.wallet_exist" /> : null}</p>
            <div onClick={ this.onAccept.bind(this) } type="submit" className={cname("button outline", {disabled: ! name_ready})}>
                <Translate content="wallet.accept" />
            </div>
        </form>);
    }

    onAccept(e) {
        if (e) e.preventDefault();
        this.setState({accept: true})
        WalletManagerStore.setNewWallet(this.state.new_wallet)
    }

    formChange(event) {
        let key_id = event.target.id
        let value = event.target.value
        if(key_id === "new_wallet") {
            //case in-sensitive
            value = value.toLowerCase()
            // Allow only valid file name characters
            if( /[^a-z0-9_-]/.test(value) ) return
        }
        let state = {}
        state[key_id] = value
        this.setState(state)
    }
}
NewWalletName = connect(NewWalletName, connectObject);

class Download extends Component {

    componentWillMount() {
        try { this.isFileSaverSupported = !!new Blob; } catch (e) {}
    }

    componentDidMount() {
        if( ! this.isFileSaverSupported )
            notify.error("File saving is not supported")
    }

    render() {
        let className = "button";
        if(this.props.cname){
          className = className + " " + this.props.cname;
        }
        return <div className={className}
            onClick={this.onDownload.bind(this)} style={this.props.style}><Translate content="wallet.download" /></div>
    }

    onDownload() {
        let blob = new Blob([ this.props.backup.contents ], {
            type: "application/octet-stream; charset=us-ascii"})

        if(blob.size !== this.props.backup.size)
            throw new Error("Invalid backup to download conversion")
        saveAs(blob, this.props.backup.name);
        WalletActions.setBackupDate();

        if (this.props.downloadCb) {
            this.props.downloadCb();
        }
    }
}
Download = connect(Download, connectObject);

class Create extends Component {

  constructor() {
    super();
    this.state = {
      agreeExport:false,
    };
  }

    getBackupName() {
        let name = this.props.wallet.current_wallet
        let address_prefix = ChainConfig.address_prefix.toLowerCase()
        if(name.indexOf(address_prefix) !== 0)
            name = address_prefix + "_" + name

        let date =  new Date();
        let month = date.getMonth() + 1;
        let day = date.getDate();
        let stampedName = `${name}_${date.getFullYear()}${month >= 10 ? month : "0" + month}${day >= 10 ? day : "0" + day}`;

        name = stampedName + ".bin";

        return name;
    }

    render() {

        let has_backup = !!this.props.backup.contents
        if( has_backup ) return <div>{this.props.children}</div>

        let ready = WalletDb.getWallet() != null

        if(!this.props.inRegister) {
          return (
            <div>
              {this.props.noText ? null :
                <div style={{ display: "flex" }}>
                  <svg className="icon" aria-hidden="true"
                       style={{ width: "34px", height: "20px", marginRight: "9px" }}>
                    <use xlinkHref="#icon-tishi3"></use>
                  </svg>
                  {this.props.newAccount ?
                    <Translate component="p" content="wallet.backup_new_account" style={{ fontSize: "12px" }}/> : null}
                  <Translate component="p" content="wallet.backup_explain" style={{ fontSize: "12px" }}/>
                </div>}
              <div
                onClick={this.onCreateBackup.bind(this)}
                className={cname("button", { disabled: !ready })}
                style={{ marginBottom: 15, marginTop: 40 }}
              >
                <Translate content="wallet.create_backup_of" name={this.props.wallet.current_wallet}/>
              </div>
              {this.props.noText ? null : <LastBackupDate/>}
            </div>
          );
        }else{
            return (
              <div>
                <div style={{display:"flex",alignItems:"center",marginTop:"80px"}}>
                  <svg className="icon" aria-hidden="true" style={{width:"26px",height:"26px",marginRight:"7px"}}>
                    <use xlinkHref="#icon-tishi3"></use>
                  </svg>
                  <Translate content="wallet.need_backup" style={{fontSize:"12px"}} style={{fontSize:"18px",color:"#FF972B"}}/>
                </div>
                <div style={{display:"flex",marginTop:"31px"}}>
                  <input className="cbox" id="ck_agree" type="checkbox" onChange={e=>this.setState({agreeExport: !this.state.agreeExport})}/>
                  <label className="checkbox-mask" htmlFor="ck_agree" style={{width:"26px",position:"relative",top:"4px"}}></label>
                  <Translate component="p" unsafe content="wallet.export_bin_agree_text" style={{fontSize:"14px",color:"#999"}}/>
                </div>
                <div style={{margin:"1em 0 20em 0"}}>
                  <div
                    onClick={this.onCreateBackup.bind(this)}
                    className={cname("button", { disabled: !ready || !this.state.agreeExport })}
                    style={{ marginBottom: 15, marginTop: 40 ,width:"31.25em",height:"3.13em"}}>
                    <Translate content="wallet.create_backup_of" name={this.props.wallet.current_wallet}/>
                  </div>
                </div>
              </div>
            );
        }
    }

    onCreateBackup() {
        let backup_pubkey = WalletDb.getWallet().password_pubkey
        backup(backup_pubkey).then( contents => {
            let name = this.getBackupName();
            BackupActions.incommingBuffer({name, contents})
        })
    }
}
Create = connect(Create, connectObject);

class LastBackupDate extends Component {
    render() {
        if (!WalletDb.getWallet()) {
            return null;
        }
        let backup_date = WalletDb.getWallet().backup_date
        let last_modified = WalletDb.getWallet().last_modified
        let backup_time = backup_date ?
            <h4 style={{fontSize:"12px",color:"#999"}}><Translate content="wallet.last_backup" /> <FormattedDate value={backup_date}/></h4>:
            <div style={{display:"flex",marginTop:"20px"}}>
              <svg className="icon" aria-hidden="true" style={{width:"1.13em",height:"1.3em",marginRight:"9px"}}>
                <use xlinkHref="#icon-tishi3"></use>
              </svg>
              <Translate style={{fontSize: 14,color:"#FF972B"}} className="facolor-error" component="p" content="wallet.never_backed_up" />
            </div>
        let needs_backup = null
        if( backup_date ) {
            needs_backup = last_modified.getTime() > backup_date.getTime() ?
              <div style={{display:"flex",marginTop:"20px"}}>
                <svg className="icon" aria-hidden="true" style={{width:"1.13em",height:"1.3em",marginRight:"9px"}}>
                  <use xlinkHref="#icon-tishi3"></use>
                </svg>
                <Translate style={{fontSize: 14,color:"#FF972B"}} className="facolor-error" component="p" content="wallet.need_backup" />
              </div>
                :
              <Translate style={{fontSize: 14}} className="success" component="p" content="wallet.noneed_backup" />
        }
        return <span>
            {backup_time}
            {needs_backup}
        </span>
    }
}

class Upload extends Component {

    reset() {
        // debugger;
        // this.refs.file_input.value = "";
        this.refs.file_input_txt.value = "";
        BackupActions.reset();
    }

    _choseFile(){
        this.refs.file_input.click();
    }

    render() {
        let resetButton = (
            <div style={{paddingTop: 20}}>
                <div
                    onClick={this.reset.bind(this)}
                    className={cname("button outline-dark", {disabled: !this.props.backup.contents})}>
                    <Translate content="wallet.reset" />
                </div>
            </div>
        );

        if(
            this.props.backup.contents &&
            this.props.backup.public_key
        )
            return <span>{this.props.children}</span>;

        let is_invalid =
            this.props.backup.contents &&
            ! this.props.backup.public_key;

        return (
            <div>
                <div style={{display:"flex"}}>
                    <input ref="file_input_txt" type="text" style={{flex:1,maxWidth:510}}/>
                    <button className="button" style={{height:50,width:115,padding:"0.85em 1.5em"}} onClick={this._choseFile.bind(this)}>选择文件</button>
                </div>
                <input ref="file_input" accept=".bin" type="file" id="backup_input_file" style={{ display: "none" }}
                    onChange={this.onFileUpload.bind(this)} />
                { is_invalid ? <h5><Translate content="wallet.invalid_format" /></h5> : null }
                {resetButton}
            </div>
        );
    }

    onFileUpload(evt) {
        let file = evt.target.files[0];
        this.refs.file_input_txt.value  = evt.target.value;
        BackupActions.incommingWebFile(file);
        this.forceUpdate();
    }
}
Upload = connect(Upload, connectObject);

class Upload2 extends Component {

  constructor() {
    super();
    this.state = {
      agreeRestore:false,
    };
  }

  reset() {
    // debugger;
    // this.refs.file_input.value = "";
    this.refs.file_input_txt.value = "";
    BackupActions.reset();
  }

  _choseFile(){
    this.refs.file_input.click();
  }

  render() {
    let isRestore = this.props.backup.contents && this.props.backup.public_key;

      // return <span>{this.props.children}</span>;

    let is_invalid =
      this.props.backup.contents &&
      ! this.props.backup.public_key;

    return (
      <div>
        <div style={{display:"flex"}}>
          <input ref="file_input_txt" type="text" style={{flex:1,maxWidth:510}} placeholder={counterpart.translate("wallet.placeholder_chose_bin")}/>
          <button className="button" style={{height:50,width:115,padding:"0.85em 1.5em"}} onClick={this._choseFile.bind(this)}>选择文件</button>
        </div>
        <input ref="file_input" accept=".bin" type="file" id="backup_input_file" style={{ display: "none" }}
               onChange={this.onFileUpload.bind(this)} />
        { is_invalid ? <h5><Translate content="wallet.invalid_format" /></h5> : null }
        { isRestore ? null :
        <div style={{display:"flex",marginTop:"0.5em"}}>
          <input className="cbox" id="ck_agree" type="checkbox" onChange={e=>this.setState({agreeRestore: e.target.checked})} checked={this.state.agreeRestore}/>
          <label className="checkbox-mask" htmlFor="ck_agree" style={{width:"26px",position:"relative",top:"4px"}}></label>
          <Translate component="p" unsafe content="wallet.agree_restore" style={{fontSize:"14px",color:"#999"}}/>
        </div>}

        { !isRestore ? null :
          <div>
            <NameSizeModified inRegisterRestore/>
            <DecryptBackup saveWalletObject={true} inRegisterRestore>
              <NewWalletName>
                <Restore/>
              </NewWalletName>
            </DecryptBackup>
          </div>}

        <div style={{paddingTop: 20}}>
          <div
            onClick={this.restore.bind(this)}
            className={cname("button", {disabled: !this.state.agreeRestore})}
            style={{width:"100%",height:"3.13em",marginTop:"1em"}} >
            <Translate content="wallet.restore_wallet" />
          </div>
        </div>
        <div style={{fontSize:"14px",margin:"2em 0 20em 0",textAlign:"center"}}>
          <Translate content="wallet.no_account" style={{color:"#999"}}/>
          <Link onClick={()=>{location.reload()}}>
            <Translate content="wallet.to_register" />
          </Link>
        </div>
      </div>
    );
  }

  restore(){
    BackupActions.incommingWebFile(this.refs.file_input.files[0]);
    this.forceUpdate();
  }

  onFileUpload(evt) {
    let file = evt.target.files[0];
    this.refs.file_input_txt.value  = evt.target.value;
    this.forceUpdate();
  }
}
Upload2 = connect(Upload2, connectObject);

class NameSizeModified extends Component {
    render() {
        if(this.props.inRegisterRestore){
          return <div>
            <p style={{color:"#999"}}><b>{this.props.backup.name}</b> ({this.props.backup.size} bytes)</p>
          </div>
        }else if(this.props.inRegister) {
          return <div style={{marginTop:"3em"}}>
                    <p><b>{this.props.backup.name}</b> ({this.props.backup.size} bytes)</p>
                </div>
        }else{
          return <span>
                    <p className="card"
                       style={{ padding: "15px 10px" }}><b>{this.props.backup.name}</b> ({this.props.backup.size} bytes)</p>
                    {this.props.backup.last_modified ?
                      <div style={{ fontSize: "14px", color: "#999" }}>{this.props.backup.last_modified}</div> : null}
                    <br/>
                </span>
        }
    }
}
NameSizeModified = connect(NameSizeModified, connectObject);

class DecryptBackup extends Component {

    static propTypes = {
        saveWalletObject: PropTypes.bool
    }

    constructor() {
        super()
        this.state = this._getInitialState()
    }

    _getInitialState() {
        return {
            backup_password: "",
            verified: false
        }
    }

    render() {
      if(this.state.verified) return <span>{this.props.children}</span>

      if(this.props.inRegisterRestore){
        if(this.state.verified) return <span>{this.props.children}</span>
        return (
          <form onSubmit={this.onPassword.bind(this)} style={{marginTop:"30px"}}>
            <input type="password" id="backup_password"
                   onChange={this.formChange.bind(this)}
                   value={this.state.backup_password}
                   placeholder={counterpart.translate("wallet.placeholder_enter_password")}
            />

            <Sha1/>
            <div
              type="submit"
              className="button"
              style={{width:"100%",height:"3.13em",marginTop:"2em"}}
              onClick={this.onPassword.bind(this)}>
              <Translate content="wallet.submit" />
            </div>
            <div style={{fontSize:"14px",margin:"2em 0 20em 0",textAlign:"center"}}>
              <Link onClick={e=>{BackupActions.reset();}}>
                <Translate content="wallet.reset" />
              </Link>
                &nbsp;&nbsp;&nbsp;&nbsp;
              <Translate content="wallet.no_account" style={{color:"#999"}}/>
              &nbsp;&nbsp;
              <Link onClick={()=>{location.reload()}}>
                <Translate content="wallet.to_register" />
              </Link>
            </div>
          </form>);
      }else{
        return (
          <form onSubmit={this.onPassword.bind(this)} style={{marginTop:"30px"}}>
            <Translate component="label" content="wallet.enter_password" style={{ color: "#999" }}/>
            <input type="password" id="backup_password"
                   onChange={this.formChange.bind(this)}
                   value={this.state.backup_password}
            />

            <Sha1/>
            <div>
              <div
                type="submit"
                className="button"
                onClick={this.onPassword.bind(this)}>
                <Translate content="wallet.submit" />
              </div>
              <div
                onClick={e=>{BackupActions.reset();}}
                className={cname("button outline-dark", {disabled: !this.props.backup.contents})}>
                <Translate content="wallet.reset" />
              </div>
            </div>
          </form>);
      }
    }

    onPassword(e) {
        if (e) e.preventDefault();
        let private_key = PrivateKey.fromSeed(this.state.backup_password || "")
        let contents = this.props.backup.contents
        decryptWalletBackup(private_key.toWif(), contents).then( wallet_object => {
            this.setState({verified: true})
            if(this.props.saveWalletObject)
                BackupStore.setWalletObjct(wallet_object)

        }).catch( error => {
            console.error("Error verifying wallet " + this.props.backup.name,
                error, error.stack)
            if(error === "invalid_decryption_key")
                notify.error("Invalid Password")
            else
                notify.error(""+error)
        })
    }

    formChange(event) {
        let state = {}
        state[event.target.id] = event.target.value
        this.setState(state)
    }

}
DecryptBackup = connect(DecryptBackup, connectObject);

class Sha1 extends Component {
    render() {
        return <div>
            <pre className="no-overflow" style={{color:"#999",fontSize:"14px"}}>{this.props.backup.sha1} * SHA1</pre>
            <br/>
        </div>;
    }
}
Sha1 = connect(Sha1, connectObject);

export {BackupCreate, BackupRestore, Restore, NewWalletName,
    Download, Create, Upload, NameSizeModified, DecryptBackup, Sha1};
