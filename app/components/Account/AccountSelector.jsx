import React from "react";
import utils from "common/utils";
import AccountImage from "../Account/AccountImage";
import AccountStore from "stores/AccountStore";
import AccountActions from "actions/AccountActions";
import Translate from "react-translate-component";
import {ChainStore, PublicKey, ChainValidation} from "seerjs/es";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import classnames from "classnames";
import counterpart from "counterpart";
import Icon from "../Icon/Icon";
import accountUtils from "common/account_utils";
import FloatingDropdown from "../Utility/FloatingDropdown";
import TypeAhead from "../Utility/TypeAhead";

/**
 * @brief Allows the user to enter an account by name or #ID
 *
 * This component is designed to be stateless as possible.  It's primary responsbility is to
 * manage the layout of data and to filter the user input.
 *
 */

class AccountSelector extends React.Component {

    static propTypes = {
        label: React.PropTypes.string, // a translation key for the label
        error: React.PropTypes.element, // the error message override
        placeholder: React.PropTypes.string, // the placeholder text to be displayed when there is no user_input
        onChange: React.PropTypes.func, // a method to be called any time user input changes
        onAccountChanged: React.PropTypes.func, // a method to be called when existing account is selected
        onAction: React.PropTypes.func, // a method called when Add button is clicked
        accountName: React.PropTypes.string, // the current value of the account selector, the string the user enters
        account: ChainTypes.ChainAccount, // account object retrieved via BindToChainState decorator (not input)
        tabIndex: React.PropTypes.number, // tabindex property to be passed to input tag
        disableActionButton: React.PropTypes.bool, // use it if you need to disable action button,
        allowUppercase: React.PropTypes.bool, // use it if you need to allow uppercase letters
        typeahead: React.PropTypes.array,
        inputStyle:React.PropTypes.object,
        wrapperStyle:React.PropTypes.object,
        inputClassName:React.PropTypes.string
    };

    static defaultProps = {
        autosubscribe: false
    };

    // can be used in parent component: this.refs.account_selector.getAccount()
    getAccount() {
        return this.props.account;
    }

    getError() {

        let scamMessage = accountUtils.isKnownScammer(this.props.accountName);

        let error = this.props.error;
        if (!error && this.props.accountName && !this.getNameType(this.props.accountName))
            error = counterpart.translate("account.errors.invalid");

        return scamMessage || error;
    }

    getNameType(value) {
        if(!value) return null;
        if(value[0] === "#" && utils.is_object_id("1.2." + value.substring(1))) return "id";
        if(ChainValidation.is_account_name(value, true)) return "name";
        if(this.props.allowPubKey && PublicKey.fromPublicKeyString(value)) return "pubkey";
        return null;
    }

    onInputChanged(event) {

        let value = null;
        if (typeof event === "string") {
            value = event;
        } else {
            value = event.target.value.trim();
        }

        if (!this.props.allowUppercase) {
            value = value.toLowerCase();
        }
        // If regex matches ^.*#/account/account-name/.*$, parse out account-name
        let newValue = value.replace("#", "").match(/(?:\/account\/)(.*)(?:\/overview)/);
        if (newValue) value = newValue[1];

        if (this.props.onChange && value !== this.props.accountName) this.props.onChange(value);
    }

    onKeyDown(event) {
        if (event.keyCode === 13) this.onAction(event);
    }

    componentDidMount() {
        if(this.props.onAccountChanged && this.props.account)
            this.props.onAccountChanged(this.props.account);
    }

    componentWillReceiveProps(newProps) {
        if((this.props.onAccountChanged && newProps.account) && newProps.account !== this.props.account)
            this.props.onAccountChanged(newProps.account);
    }

    onLinkAccount(e) {
        e.preventDefault();
        AccountActions.linkAccount(this.props.accountName);
    }

    onUnLinkAccount(e) {
        e.preventDefault();
        AccountActions.unlinkAccount(this.props.accountName);
    }

    onAction(e) {
        e.preventDefault();
        if(this.props.onAction && !this.getError() && !this.props.disableActionButton) {
            if (this.props.account)
                this.props.onAction(this.props.account);
            else if (this.getNameType(this.props.accountName) === "pubkey")
                this.props.onAction(this.props.accountName);
        }
    }

    render() {
        let linkedAccounts = AccountStore.getState().linkedAccounts;
        let error = this.getError();
        let type = this.getNameType(this.props.accountName);
        let lookup_display;
        if (this.props.allowPubKey) {
            if (type === "pubkey") lookup_display = "Public Key";
        } else if (this.props.account) {
            if(type === "name") lookup_display = "#" + this.props.account.get("id").substring(4);
            else if (type === "id") lookup_display = this.props.account.get("name");
        } else if (!error && this.props.accountName) error = counterpart.translate("account.errors.unknown");

        let member_status = null;
        if (this.props.account)
            member_status = counterpart.translate("account.member." + ChainStore.getAccountMemberStatus(this.props.account));

        let action_class = classnames("button", {"disabled" : !(this.props.account || type === "pubkey") || error || this.props.disableActionButton});

        let typeAheadAccounts = [];

        let isGreenAccount = false;
        let lookup_name = this.props.account ? this.props.account.get("name"):"";

        if (this.props.typeahead) {
            this.props.typeahead.map(function(account){
                typeAheadAccounts.push({id:account,label:account});
            });

            isGreenAccount = this.props.typeahead.indexOf(lookup_name) !== -1;
        }

        let typeaheadHasAccount = !!this.props.account ? typeAheadAccounts.reduce((boolean, a) => {
            return boolean || a.label === this.props.account.get("name");
        }, false) : false;
        if (!!this.props.account && !typeaheadHasAccount) {
            typeAheadAccounts.push({id: this.props.account.get("name"), label: this.props.account.get("name")});
        }

        let linked_status = !this.props.accountName ? null : (linkedAccounts.has(this.props.accountName)) ?
            <span className="tooltip" data-place="top" data-tip={counterpart.translate("tooltip.follow_user")} onClick={this.onUnLinkAccount.bind(this)}><Icon className={""+(isGreenAccount? " green":"")} style={{position:"absolute",top:"-0.15em",right:".2em"}} name="user" /></span>
            : <span className="tooltip" data-place="top" data-tip={counterpart.translate("tooltip.follow_user_add")} onClick={this.onLinkAccount.bind(this)}><Icon size="1_5x" style={{position:"absolute",top:"-0.45em",right:".2em"}} name="plus-circle" className="color-primary"/></span>;

        return (
            <div className="account-selector" style={this.props.style}>
                <div className="content-area">
                    {this.props.label ? (
                    <div className={"header-area" + (this.props.hideImage ? " no-margin" : "")}>
                        {error && !lookup_display ?
                            <label className="right-label"><span style={{color: "#ff3950"}}>Unknown Account</span></label> :
                            <label className={"right-label"+(isGreenAccount? " green":"")} ><span>{member_status}</span>&nbsp;<span style={{marginRight:"1.5em"}}> {lookup_display}</span> &nbsp; {linked_status}</label>
                        }
                        <Translate className="label-text" content={this.props.label}/>
                    </div>) : null}
                    <div className="input-area">
                        <div className="inline-label input-wrapper" style={this.props.wrapperStyle}>
                            {type === "pubkey" ? <div className="account-image"><Icon name="key" size="4x"/></div> :
                            this.props.hideImage ? null : <AccountImage size={{height: this.props.size || 80, width: this.props.size || 80}}
                                account={this.props.account ? this.props.account.get("name") : null} custom_image={null}/>}
                                {(typeof this.props.typeahead !== "undefined")?
                                 <TypeAhead items={typeAheadAccounts}
                                    style={{textTransform: "lowercase", fontVariant: "initial"}}
                                    name="username"
                                    id="username"
                                    defaultValue={this.props.accountName || ""}
                                    placeholder={this.props.placeholder || counterpart.translate("account.name")}
                                    ref="user_input"
                                    onSelect={this.onInputChanged.bind(this)}
                                    onChange={this.onInputChanged.bind(this)}
                                    onKeyDown={this.onKeyDown.bind(this)}
                                    tabIndex={this.props.tabIndex}
                                    inputProps={{placeholder: "Search for an account"}}
                                />
                            :<input style={{textTransform: "lowercase", fontVariant: "initial", ...this.props.inputStyle}}
                                    className={this.props.inputClassName}
                                    name="username"
                                    id="username"
                                    type="text"
                                    value={this.props.accountName || ""}
                                    placeholder={this.props.placeholder || counterpart.translate("account.name")}
                                    ref="user_input"
                                    onChange={this.onInputChanged.bind(this)}
                                    onKeyDown={this.onKeyDown.bind(this)}
                                    tabIndex={this.props.tabIndex}
                                />}
                                {this.props.dropDownContent ? <div className="form-label select floating-dropdown">
                                    <FloatingDropdown
                                        entries={this.props.dropDownContent}
                                        values={this.props.dropDownContent.reduce((map, a) => {if (a) map[a] = a; return map;}, {})}
                                        singleEntry={this.props.dropDownContent[0]}
                                        value={this.props.dropDownValue || ""}
                                        onChange={this.props.onDropdownSelect}
                                    />
                                </div> : null}
                                { this.props.children }
                                { this.props.onAction ? (
                                    <button className={action_class}
                                        onClick={this.onAction.bind(this)}>
                                        <Translate content={this.props.action_label}/></button>
                                    ) : null }
                                </div>
                            </div>

                            {error ? <div className={"error-area " + (this.props.hideImage ? " no-padding" : "")} >
                                <span>{error}</span>
                            </div> : null}
                        </div>
            </div>
        );

    }
}

export default BindToChainState(AccountSelector, {keep_updating: true});
