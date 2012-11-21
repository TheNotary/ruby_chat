var global = '';
var groom_hash = 'lkasjdA';

jQuery.fn.slideLeftHide = function( speed, callback ) { this.animate( { width: "hide", paddingLeft: "hide", paddingRight: "hide", marginLeft: "hide", marginRight: "hide" }, speed, callback ); }
jQuery.fn.slideLeftShow = function( speed, callback ) { this.animate( { width: "show", paddingLeft: "show", paddingRight: "show", marginLeft: "show", marginRight: "show" }, speed, callback ); }


var adminChat = function(){}

adminChat.switchRoom = function(e){
	var room_hash = e.getAttribute("data-room_hash");
	adminChat.switchTabs(room_hash);
	adminChat.switchMessages(room_hash);
}

adminChat.switchTabs = function(room_hash){
	$('.chat-tabs li').removeClass("active");
	$('a[data-room_hash="' + room_hash + '"]').parent().addClass('active');
	adminChat.clearUpdatedChatCounts(room_hash);
}

adminChat.switchMessages = function (room_hash){
	adminChat.clearCurrentlyDisplayedMessageWindow();
	
	adminChat.displayProperWindow(room_hash);
}

adminChat.clearCurrentlyDisplayedMessageWindow = function(){
	$('.chatShowing').removeClass('chatShowing');
}

adminChat.displayProperWindow = function(room_hash){
	var properWindow = $('.chatEncapsulator[data-room_hash=' + room_hash + ']');
	properWindow.addClass('chatShowing');
}


adminChat.clearUpdatedChatCounts = function(room_hash) {
	var missedChatSpan = $('a[data-room_hash="' + room_hash + '"] span');
	missedChatSpan.html('0');
	missedChatSpan.removeClass('badge-important');
	missedChatSpan.slideLeftHide();
}

adminChat.incrementMissedChatCount = function(room_hash) {
	if ( room_hash == undefined ) //  debugging...
		room_hash = 'lkasjdB';
	
	var parent = $('a[data-room_hash="' + room_hash + '"]').parent();
	var isThisTabFocused = parent.hasClass('active');
	
	if ( !isThisTabFocused ){  // if the tab is already focused, don't do anything, they see the new msgs
		var missedChatSpan = $('a[data-room_hash="' + room_hash + '"] span');
		var numberMissed = parseInt(missedChatSpan.html());
		numberMissed++;
		missedChatSpan.html(numberMissed);
		
		missedChatSpan.addClass('badge-important');
		missedChatSpan.slideLeftShow();
	}
}

adminChat.handleKeyDown = function(e, frm){
	
	if (e.keyCode == 13 && e.ctrlKey){   // for some reason, when holding ctrl + enter, keycode becomes 10...
		adminChat.submitMessage(frm);
		return false;
	}
	//else if (e.keyCode < 16 || e.keyCode > 19){
		//adminChat.handleTextChanged(e, frm);
	//}
}

var isResponding = false;

function handleKeyUp(e, frm){
	var formsValue = frm.value;
	var room_hash = frm.parentElement.parentElement.getAttribute('data-room_hash');
	
	if (formsValue != ""){
		// send respondingOn, unless we already did that
		if (!isResponding)
			adminChat.setIsResponding(room_hash, true);
	}
	else{
		if (isResponding)
			adminChat.setIsResponding(room_hash, false);
	}
}


adminChat.setIsResponding = function(room_hash, trueOrFalse){
	isResponding = trueOrFalse;
	
	adminChat.transmitRespondingSignal(room_hash, isResponding);
}

adminChat.transmitRespondingSignal = function(room_hash, trueOrFalse){
	var type = 'respondingOff';
	if (trueOrFalse)
		type = 'respondingOn';
	var role = myRole;
	var speaker = myName;
	var msg = 'a';
	
	fayeClient.publish('/' + room_hash, {type: type, role: role, speaker: speaker, text: msg});
}

adminChat.submitMessage = function(frm){
	var textArea = frm.parentElement.children[1];
	var room_hash = frm.parentElement.parentElement.getAttribute('data-room_hash');
	var msg = textArea.value;
	
	adminChat.transmitMessage(room_hash, msg);
	textArea.value = "";
	textArea.focus();
}

adminChat.transmitMessage = function(room_hash, msg){
	type = 'msg';
	role = myRole;
	speaker = myName;
	msg = encryptMessage(msg);
	
	fayeClient.publish('/' + room_hash, {type: type, role: role, speaker: speaker, text: msg});
}

function encryptMessage(msg){
	msg = msg.replace("\n", "<br>");
	return $.base64.encode(msg);
}

function decryptMessage(msg){
	return $.base64.decode(msg);
}










var chatRoom = function(){}
    
chatRoom.subscribeToRoom = function(room_hash){
	var client = fayeClient;
	var subscription;
	subscription = client.subscribe('/' + room_hash, function(message) {
      // handle message
    	
    	var type = message.type;
    	
    	if (type == 'msg'){
    		chatRoom.handleChatMessage(room_hash, message);
    	}
  		else{
  			//alert(type);
  			chatRoom.handleRespondingMessage(room_hash, message);
  		}
    });
    return subscription;
}

chatRoom.handleChatMessage = function(room_hash, message){
	var type = message.type;
	var role = message.role;
	var msg = decryptMessage(message.text);
	var speaker = message.speaker;
	
	if (type == 'msg')
		chatRoom.putNewMessageInWindow(room_hash, msg, speaker);
	  
	if (type.indexOf('responding') != -1)
		chatRoom.handleRespondingMessage(room_hash, message);
}

chatRoom.handleRespondingMessage = function(room_hash, message){
	var type = message.type;
	var role = message.role;
	
	if (role != myRole){
		if (type == "respondingOn")
			chatRoom.toggleRespondingMessage(room_hash, true);	
		else if (type == 'respondingOff')
			chatRoom.toggleRespondingMessage(room_hash, false);
	}
}



chatRoom.toggleRespondingMessage = function(room_hash, shouldDisplayMessage){
	var userIsTypingDiv = $('.chatEncapsulator[data-room_hash=' + room_hash + '] div .user-is-typing');
	if (shouldDisplayMessage){
		userIsTypingDiv.removeClass('hidden');
	}
	else{
		userIsTypingDiv.addClass('hidden');
	}
}

chatRoom.createNewChatClient = function(){
	var client = new Faye.Client('http://' + chatServer + ':' + chatPort + '/faye', {
      timeout: 120
    });
    return client;
}

chatRoom.putNewMessageInWindow = function(room_hash, msg, speaker){
	var coloring = "them";
	if (speaker == myName)
		coloring = "you";
	var prefix = "<p class='chat-prefix'>" + speaker + ":  </p>";
	msg = "<p class='chat-msg'>" + msg + "</p>";
	var appendMe = '<div class="chat-response ' + coloring + '">' + prefix + msg + '</div><div class="clear"></div>';
	$('.chatEncapsulator[data-room_hash=' + room_hash + '] .chat-msgs').append(appendMe);
	chatRoom.scrollToLatestMessage();
	adminChat.incrementMissedChatCount(room_hash);
}

chatRoom.scrollToLatestMessage = function(){
	$('.chat-msgs').animate({ scrollTop: $('.chat-msgs').prop('scrollHeight')}, 1000);
}


function btnCancelSubscription(){
  subscription.cancel();
}


var chatServer = window.location.hostname;
var chatPort = '10614';
var myRole = 'admin';
var myName = 'Sales';

var fayeClient = chatRoom.createNewChatClient();
var chatSubscriptions = new Array();
chatSubscriptions['lkasjdA'] = chatRoom.subscribeToRoom('lkasjdA');
