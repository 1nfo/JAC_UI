var GLOBAL_JAC_taskID = '';

$("#btn_createTask").click(function(e){
	document.getElementById("InputBlock_task").style.display = "block";
	// document.getElementById("InputRow_taskID").style.display = "none";
	task_to_create = 1;
})

$("#btn_resumeTask").click(function(e){
	document.getElementById("InputBlock_task").style.display = "block";
	// document.getElementById("InputRow_taskID").style.display = "block";
	task_to_create = 0;
})

$("#btn_taskConfirm").click(function(e){
	if(!$("#jac_taskName").val().match(/^[a-zA-Z]+$/)){
		alert("Name needs to be letters only");
	}
	else {
		var res = $.post("/post/taskName",{
			"taskName":$("#jac_taskName").val(),
			"taskID":$("#jac_taskID").val(),
			"create":task_to_create
		},function(data){
			data = JSON.parse(data)
			GLOBAL_JAC_taskID = data["taskID"]
			// buff = data["buffer"].replace("\n","<br/>")
			// console.log(buff)
			// $("#output").append(buff)
			document.getElementById("InputBlock_slaveNem").style.display = "block";
			document.getElementById("cleaup_btn_div").style.display = "block";
		})
	}
})

$("#btn_setSlaveNum").click(function(e){
	if(!$("#jac_slaveNum").val().match(/^[1-9]+[0-9]*$/)){
		alert("Number must be greater than 0");
	}
	else{
		var res = $.post("/post/slaveNum",
			{"slaveNum":$("#jac_slaveNum").val(),"taskID":GLOBAL_JAC_taskID},
			function(data){
				// console.log(data)
				document.getElementById("InputBlock_uploadFiles").style.display = "block";
			})
	}
})

$("#btn_uploadTask").click(function(e){
	var filesList = $("#jac_uploadFiles").prop("files")
	var form_data = new FormData();
	form_data.append("taskID",GLOBAL_JAC_taskID)
	$.each(filesList,function(i,d){form_data.append("file",d)})
	$.ajax({
		url:"/uploadFiles",
		dataType: "text",
		chache: false,
		contentType: false,
		processData: false,
		data: form_data,
		type: "post",
		success:function(data){
			alert("succeed");
			document.getElementById("InputBlock_execJMX").style.display = "block";
		},
		error:function(err){alert("failed")}
	})
})

$("#btn_runTask").click(function(e){
	var jmx_to_run = $("#jac_JMXName").val()
	$.post("/post/run",{"jmx_name":jmx_to_run,"taskID":GLOBAL_JAC_taskID},
		function(data){
			console.log(data)
		})
})

$("#btn_cleanupTask").click(function(e){
	$.post("/post/cleanup",{"taskID":GLOBAL_JAC_taskID},
		function(data){
			console.log(data)
			document.getElementById("cleaup_btn_div").style.display = "none";
			document.getElementById("InputBlock_slaveNem").style.display = "none";
			document.getElementById("InputBlock_uploadFiles").style.display = "none";
			document.getElementById("InputBlock_execJMX").style.display = "none";
			
		})
})

$("#btn_clear").click(function(){
	$("#output").empty()
})