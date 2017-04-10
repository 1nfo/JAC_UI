var GLOBAL_JAC_taskID = '';
var GLOBAL_JAC_SLAVENUM = 0;

$("#btn_createTask").click(function(e){
	$(".btn").addClass("disabled")
	$("#jac_taskName").prop('readonly', false);
	$("#jac_slaveNum").prop('readonly', false);
	document.getElementById("InputRow_confirmBtn").style.display = "block";
	document.getElementById("cleaup_btn_div").style.display = "none";
	document.getElementById("InputRow_task").style.display = "block";
	document.getElementById("InputRow_resumeTasks").style.display = "none";
	document.getElementById("InputRow_slaveNem").style.display = "block";
	document.getElementById("InputBlock_uploadFiles").style.display = "none";
	document.getElementById("InputBlock_execJMX").style.display = "none";
	// document.getElementById("InputRow_taskID").style.display = "none";
	task_to_create = 1;
	$(".btn").removeClass("disabled")
})

$("#btn_resumeTask").click(function(e){
	$(".btn").addClass("disabled")
	$("#jac_taskName").val("")
	document.getElementById("InputRow_confirmBtn").style.display = "none";
	document.getElementById("cleaup_btn_div").style.display = "none";
	document.getElementById("InputRow_task").style.display = "none";
	document.getElementById("InputRow_resumeTasks").style.display = "block";
	document.getElementById("InputRow_slaveNem").style.display = "none";
	document.getElementById("InputBlock_uploadFiles").style.display = "none";
	document.getElementById("InputBlock_execJMX").style.display = "none";
	// document.getElementById("InputRow_taskID").style.display = "block";
	task_to_create = 0;
	$("#InputRow_resumeTasks").text("")
	$.post("/post/getTaskIDs","",function(data){
		var data = JSON.parse(data)
		if (data.length==0) {
			$("#InputRow_resumeTasks").append("<div>No task running</div>")
		} else {
			$.each(data,function(i,d){
				var inputToAdd = " <input class='btn btn-default taskToResume' value='"+
					d.split("_",1)+
					"' title='"+d+"'>"
				var divToAdd = "<div class='row panel'> </div>"
				$(divToAdd).append($(inputToAdd).data("id",d)).appendTo("#InputRow_resumeTasks")
			})
			$(".taskToResume").click(function(e){
				var taskID = $(e.target).data()["id"]
				$("#jac_taskID").val(taskID)
				$("#jac_taskName").val($(e.target).val())
				$("#btn_taskConfirm").trigger("click")
			})
			$(".taskToResume").tooltip();	
			
		}
		$(".btn").removeClass("disabled")
	}).error(function(){$(".btn").removeClass("disabled")})
	
})

$("#btn_taskConfirm").click(function(e){
	if(!$("#jac_taskName").val().match(/^[a-zA-Z][a-zA-Z0-9]+$/)){
		if(task_to_create==1)alert("Name needs to be letters and number only");
		else alert("Select one taskToResume")
	}
	else if(!$("#jac_slaveNum").val().match(/^[1-9]+[0-9]*$/)&&task_to_create == 1){
		alert("Number must be greater than 0");
	}
	else {
		$(".btn").addClass("disabled")
		var res = $.post("/post/taskName",{
			"taskName":$("#jac_taskName").val(),
			"taskID":$("#jac_taskID").val(),
			"slaveNum":$("#jac_slaveNum").val(),
			"create":task_to_create
		},function(data){
			data = JSON.parse(data)
			GLOBAL_JAC_taskID = data["taskID"]
			GLOBAL_JAC_SLAVENUM = data["slaveNum"]
			$("#jac_slaveNum").val(data["slaveNum"])
			$("#uploaded_files_status").val(data["files"].length+" file(s) uploaded")
			$("#jac_JMXName").empty()
			$.each(data["jmxList"],function(i,d){
				$("#jac_JMXName").append("<option value=\""+d+"\">"+d+"</option>")
			})
			document.getElementById("InputRow_task").style.display = "block";
			document.getElementById("InputRow_slaveNem").style.display = "block";
			document.getElementById("InputRow_resumeTasks").style.display = "none";
			document.getElementById("cleaup_btn_div").style.display = "block";
			document.getElementById("InputBlock_uploadFiles").style.display = "block";
			document.getElementById("InputBlock_execJMX").style.display = "block";
			document.getElementById("InputRow_confirmBtn").style.display = "none";
			$("#jac_taskName").prop('readonly', true);
			$("#jac_slaveNum").prop('readonly', true);
			$(".btn").removeClass("disabled");
		}).error(function(){$(".btn").removeClass("disabled");})
	}
})

// $("#btn_setSlaveNum").click(function(e){
// 	if(!$("#jac_slaveNum").val().match(/^[1-9]+[0-9]*$/)){
// 		alert("Number must be greater than 0");
// 	}
// 	else{
// 		$(".btn").addClass("disabled")
// 		var res = $.post("/post/slaveNum",
// 			{"slaveNum":$("#jac_slaveNum").val(),"taskID":GLOBAL_JAC_taskID},
// 			function(data){
// 				document.getElementById("InputBlock_uploadFiles").style.display = "block";
// 				$(".btn").removeClass("disabled");
// 				GLOBAL_JAC_SLAVENUM = $("#jac_slaveNum").val();
// 			})
// 			.error(function(){$(".btn").removeClass("disabled");})
// 	}
// })

$("#btn_uploadTask").click(function(e){
	var filesList = $("#jac_uploadFiles").prop("files")
	var form_data = new FormData();
	form_data.append("taskID",GLOBAL_JAC_taskID)
	$.each(filesList,function(i,d){form_data.append("file",d)})
	$(".btn").addClass("disabled")
	$.ajax({
		url:"/uploadFiles",
		dataType: "text",
		chache: false,
		contentType: false,
		processData: false,
		data: form_data,
		type: "post",
		success:function(data){
			data = JSON.parse(data)
			$("#uploaded_files_status").val(data["files"].length+" file(s) uploaded")
			$("#jac_JMXName").empty()
			$.each(data["jmxList"],function(i,d){
				// d = d.name
				// if(d.match(/^[\s\S]*\.jmx$/))
				$("#jac_JMXName").append("<option value=\""+d+"\">"+d+"</option>")
			})
			// document.getElementById("InputBlock_execJMX").style.display = "block";
			alert("succeed");
		},
		error:function(err){alert("failed")},
		complete:function(){$(".btn").removeClass("disabled");}
	})
})

$("#btn_cleanupTask").click(function(e){
	$(".btn").addClass("disabled")
	$.post("/post/cleanup",{"taskID":GLOBAL_JAC_taskID},
		function(data){
			document.getElementById("InputRow_task").style.display = "none";
			document.getElementById("cleaup_btn_div").style.display = "none";
			document.getElementById("InputRow_slaveNem").style.display = "none";
			document.getElementById("InputBlock_uploadFiles").style.display = "none";
			document.getElementById("InputBlock_execJMX").style.display = "none";
			$(".btn").removeClass("disabled")
		}).error(function(){$(".btn").removeClass("disabled")})
})

// stop button
$("#btn_stopRunning").click(function(e){
	$(".btn").addClass("disabled")
    $.post("/post/stop",{"taskID":GLOBAL_JAC_taskID},function(data){
    	$(".btn").removeClass("disabled")
    }).error(function(){$(".btn").removeClass("disabled")})
})

$("#btn_clear").click(function(){
	$("#output").empty()
})