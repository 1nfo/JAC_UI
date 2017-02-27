$("#btn_createTask").click(function(e){
	document.getElementById("InputBlock_task").style.display = "block";
	document.getElementById("InputRow_taskID").style.display = "none";
})

$("#btn_resumeTask").click(function(e){
	document.getElementById("InputBlock_task").style.display = "block";
	document.getElementById("InputRow_taskID").style.display = "block";
})

$("#btn_taskConfirm").click(function(e){
	if(!$("#jac_taskName").val().match(/^[a-zA-Z]+$/)){
		alert("Name needs to be letters only");
	}
	else {
		var res = $.post("/post/taskName",{"taskName":$("#jac_taskName").val()})
		console.log(res);
		document.getElementById("InputBlock_slaveNem").style.display = "block";
	}
})

$("#btn_setSlaveNum").click(function(e){
	if(!$("#jac_slaveNum").val().match(/^[1-9]+[0-9]*$/)){
		alert("Number must be greater than 0");
	}
	else{
		var res = $.post("/post/slaveNum",{"slaveNum":$("#jac_slaveNum").val()})
		console.log(res);
		document.getElementById("InputBlock_uploadFiles").style.display = "block";
	}
})

$("#btn_uploadTask").click(function(e){
	var filesList = $("#jac_uploadFiles").prop("files")
	var form_data = new FormData();
	gata = null
	$.each(filesList,function(i,d){form_data.append("file",d)})
	$.ajax({
		url:"/uploadFiles",
		dataType: "text",
		chache: false,
		contentType: false,
		processData: false,
		data: form_data,
		type: "post",
		success:function(data){alert("succeed")},
		error:function(err){alert("failed")}
	})

	document.getElementById("InputBlock_execJMX").style.display = "block";
})

$("#btn_runTask").click(function(e){
	console.log(e)
})

$("#btn_cleanupTask").click(function(e){
	console.log(e)
})

$("#btn_clear").click(function(){
	$("#output").empty()
})