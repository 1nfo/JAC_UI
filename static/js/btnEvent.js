var GLOBAL_JAC_taskID = '';

$("#btn_createTask").click(function(e){
	$(".btn").addClass("disabled")
	$("#jac_taskName").prop('disabled', false);
	document.getElementById("InputRow_confirmBtn").style.display = "block";
	document.getElementById("cleaup_btn_div").style.display = "none";
	document.getElementById("InputRow_task").style.display = "block";
	document.getElementById("InputRow_resumeTasks").style.display = "none";
	document.getElementById("InputBlock_slaveNem").style.display = "none";
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
	document.getElementById("InputBlock_slaveNem").style.display = "none";
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
					d.split("_")[0]+
					"'>"
				var divToAdd = "<div class='panel'> </div>"
				$(divToAdd).append($(inputToAdd).data("id",d)).appendTo("#InputRow_resumeTasks")
			})
			$(".taskToResume").click(function(e){
				var taskID = $(e.target).data()["id"]
				$("#jac_taskID").val(taskID)
				$("#jac_taskName").val($(e.target).val())
				$("#btn_taskConfirm").trigger("click")
			})	
		}
		$(".btn").removeClass("disabled")
	}).error(function(){$(".btn").removeClass("disabled")})
	
})

$("#btn_taskConfirm").click(function(e){
	if(!$("#jac_taskName").val().match(/^[a-zA-Z]+$/)){
		if(task_to_create==1)alert("Name needs to be letters only");
		else alert("Select one taskToResume")
	}
	else {
		$(".btn").addClass("disabled")
		document.getElementById("InputRow_task").style.display = "block";
		document.getElementById("InputRow_resumeTasks").style.display = "none";
		document.getElementById("InputRow_confirmBtn").style.display = "none";
		var res = $.post("/post/taskName",{
			"taskName":$("#jac_taskName").val(),
			"taskID":$("#jac_taskID").val(),
			"create":task_to_create
		},function(data){
			data = JSON.parse(data)
			GLOBAL_JAC_taskID = data["taskID"]
			$("#jac_slaveNum").val(data["slaveNum"])
			$.each(data["jmxList"],function(i,d){
				$("#jac_JMXName").append("<option value=\""+d+"\">"+d+"<option>")
			})
			document.getElementById("InputBlock_slaveNem").style.display = "block";
			document.getElementById("cleaup_btn_div").style.display = "block";
			document.getElementById("InputBlock_uploadFiles").style.display = "block";
			document.getElementById("InputBlock_execJMX").style.display = "block";
			$("#jac_taskName").prop('disabled', true);
			$(".btn").removeClass("disabled");
		}).error(function(){$(".btn").removeClass("disabled");})
	}
})

$("#btn_setSlaveNum").click(function(e){
	if(!$("#jac_slaveNum").val().match(/^[1-9]+[0-9]*$/)){
		alert("Number must be greater than 0");
	}
	else{
		$(".btn").addClass("disabled")
		var res = $.post("/post/slaveNum",
			{"slaveNum":$("#jac_slaveNum").val(),"taskID":GLOBAL_JAC_taskID},
			function(data){
				// console.log(data)
				document.getElementById("InputBlock_uploadFiles").style.display = "block";
				$(".btn").removeClass("disabled");
			})
			.error(function(){$(".btn").removeClass("disabled");})
	}
})

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
			alert("succeed");
			document.getElementById("InputBlock_execJMX").style.display = "block";
		},
		error:function(err){alert("failed")},
		complete:function(){$(".btn").removeClass("disabled");}
	})
})

$("#btn_runTask").click(function(e){
	var jmx_to_run = $("#jac_JMXName").val()
	if(jmx_to_run==null || !jmx_to_run.match(/^[\s\S]*\.jmx$/)){
		alert("Invaild JMX file");
	}else{
		$(".btn").addClass("disabled")
		$.post("/post/run",{"jmx_name":jmx_to_run,"taskID":GLOBAL_JAC_taskID},
			function(data){
				$(".btn").removeClass("disabled");
			}).error(function(){$(".btn").removeClass("disabled");})
	}
})

$("#btn_cleanupTask").click(function(e){
	$(".btn").addClass("disabled")
	$.post("/post/cleanup",{"taskID":GLOBAL_JAC_taskID},
		function(data){
			document.getElementById("InputRow_task").style.display = "none";
			document.getElementById("cleaup_btn_div").style.display = "none";
			document.getElementById("InputBlock_slaveNem").style.display = "none";
			document.getElementById("InputBlock_uploadFiles").style.display = "none";
			document.getElementById("InputBlock_execJMX").style.display = "none";
			$(".btn").removeClass("disabled")
			
		}).error(function(){$(".btn").removeClass("disabled")})
})

$("#btn_clear").click(function(){
	$("#output").empty()
})