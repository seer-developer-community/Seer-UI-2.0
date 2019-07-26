import React, {Component} from "react";
import {FormattedDate} from "react-intl";
import Translate from "react-translate-component";
import WalletActions from "actions/WalletActions";
import WalletDb from "stores/WalletDb";
import {hash} from "seerjs/es";

export default class BackupBrainkey extends Component {

    constructor() {
        super()
        this.state = this._getInitialState()
    }

    _getInitialState() {
        return {
            password: null,
            brainkey: null,
            invalid_password: false
        }
    }

    render() {
        var content
        var brainkey_backup_date = WalletDb.getWallet().brainkey_backup_date;

        var brainkey_backup_time = brainkey_backup_date ?
            <div><Translate content="wallet.brainkey_backed_up" />: <FormattedDate value={brainkey_backup_date}/></div> :
            <Translate className="facolor-error" component="p" content="wallet.brainkey_not_backed_up" style={{fontSize: 14,color:"#FF972B"}}/>

        if(this.state.verified) {
            var sha1 = hash.sha1(this.state.brainkey).toString('hex').substring(0,4)
            content = <div>
                <h3><Translate content="wallet.brainkey" /></h3>
                <div className="card"><div className="card-content">
                    <h5>{this.state.brainkey}</h5></div></div>
                <br/>
                <pre className="no-overflow">sha1 hash of the brainkey: {sha1}</pre>
                <br/>
                {brainkey_backup_time}
            </div>
        }

        if(!content && this.state.brainkey) {
            var sha1 = hash.sha1(this.state.brainkey).toString('hex').substring(0,4)
            content = <span>
              <section style={{padding: "0"}} className="block-list">
                <header><Translate content="wallet.brainkey" />:</header>
              </section>
                <div className="card" style={{width:"630px"}}><div className="card-content">
                    <h6>{this.state.brainkey}</h6></div></div>
                    <div style={{padding: "10px 0"}}>
                        <pre className="no-overflow" style={{color:"#333"}}>sha1 hash of your brainkey: {sha1}</pre>
                    </div>

                <div style={{display:"flex",marginTop:20}}>
                      <svg className="icon" aria-hidden="true" style={{width:"18px",height:"20px",marginRight:"9px"}}>
                        <use xlinkHref="#icon-tishi1"></use>
                      </svg>
                        <p style={{fontSize: 14,color:"#FF972B"}}>
                            <Translate content="wallet.brainkey_w1" /><br/>
                            <Translate content="wallet.brainkey_w2" /><br/>
                            <Translate content="wallet.brainkey_w3" />
                        </p>
               </div>
                <div style={{padding: "10px 0 20px 0"}}>

                </div>

                <button className="button success" onClick={this.onComplete.bind(this)}><Translate content="wallet.verify" /></button>
                <button className="button cancel" onClick={this.reset.bind(this)}><Translate content="wallet.cancel" /></button>

            </span>
        }

        if(!content) {
            var valid = this.state.password && this.state.password !== ""
            content = <span>
                <label><Translate content="wallet.enter_password" /></label>
                <form onSubmit={this.onSubmit.bind(this)} className="name-form" noValidate>
                    <input type="password" id="password" onChange={this.onPassword.bind(this)} style={{width:"630px",maxWidth:"630px"}}/>
                    <div style={{display:"flex"}}>
                      <svg className="icon" aria-hidden="true" style={{width:"18px",height:"20px",marginRight:"9px"}}>
                        <use xlinkHref="#icon-tishi3"></use>
                      </svg>
                        <p style={{fontSize: 14,color:"#FF972B"}} >
                            {this.state.invalid_password ?
                                <span className="error">Invalid password</span>:
                                <span><Translate content="wallet.pwd4brainkey" /></span>}
                        </p>
                     </div>

                    <button className="button success"><Translate content="wallet.show_brainkey" /></button>

                     <div style={{display:"flex",marginTop:20}}>
                      <svg className="icon" aria-hidden="true" style={{width:"18px",height:"20px",marginRight:"9px"}}>
                        <use xlinkHref="#icon-tishi3"></use>
                      </svg>
                        <p style={{fontSize: 14,color:"#FF972B"}}>{brainkey_backup_time}</p>
                     </div>

                </form>
            </span>
        }
        return <div className="grid-block vertical">
            <div className="grid-content no-overflow">
                {content}
            </div>
        </div>
    }


    onComplete(brnkey) {
        this.setState({ verified: true });
        WalletActions.setBrainkeyBackupDate();
    }

    reset(e) {
        if (e) {
            e.preventDefault();
        }
        this.setState(this._getInitialState())
    }

    onBack(e) {
        e.preventDefault()
        window.history.back();
    }

    onSubmit(e) {
        e.preventDefault();
        var was_locked = WalletDb.isLocked()
        let {success} = WalletDb.validatePassword(this.state.password, true);
        if(success) {
            var brainkey = WalletDb.getBrainKey()
            if(was_locked) WalletDb.onLock()
            this.setState({ brainkey })
        } else
            this.setState({ invalid_password: true })
    }

    onPassword(event) {
        this.setState({ password: event.target.value, invalid_password: false })
    }
}
