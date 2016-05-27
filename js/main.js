var brands,interactions,users,o_data,header,colors,chart; 

// 500 do material design
var default_colors = [
	'#9C27B0', // roxo
	'#2196F3', // azul
	'#E91E63', // rosa
	'#3F51B5', // índigo
	'#FF5722', // laranja
	'#8BC34A', // verde
	'#F44336', // vermelho
	'#795548', // marrom
	'#607D8B', // blue grey
	'#009688', // teal
	'#FFEB3B', // amarelo
];

// Ao selecionar uma marca, filtra pelos dados referentes à ela
$(document).on('change','#sel-brand',changeBrand);

// Ao clicar para fechar modal
$(document).on('click','.btn-close,.modal',function(e){
	// Fecha, a menos que tenha clicado em algum elemento de profile-box (que não seja o botão de fechar)
	if(e.target.className == 'btn-close' || (e.target.className != 'profile-box' && $(e.target).parents('.profile-box').length == 0)){
		$('.modal').fadeOut();
	}
});

// Carrega os dados dos jsons
function loadData(){
	$.getJSON( "json/users.json", function( data ) {
		users = data;

		$.getJSON( "json/brands.json", function( data ) {
			brands = data;

			// Ao carregar marcas, preenche o select

			// Opção inicial
			$('<option/>').attr('value','').text('Todas as marcas').appendTo('#sel-brand');

			// Marcas
			$.each(brands,function(i,brand){
				$('<option/>')
					.attr('value',brand.id)
					.text(brand.name)
					.appendTo('#sel-brand')
				;

				// Associa uma cor a cada marca
				brand.color = default_colors[i];
			});

			$.getJSON( "json/interactions.json", function( data ) {
				interactions = data;

				// filtra os dados e carrega o gráfico
				changeBrand();
			});
		});

	});
}

// Organiza os dados dos jsons conforme precisa ser exibido pelo gráfico
function organizeData(options){

	o_data = [];

	// Inicializando array organizado
	$.each(users,function(i,user){
		o_data[user.id] = user;
		o_data[user.id]['brands'] = [];
		o_data[user.id]['total'] = 0;

		$.each(brands,function(j,brand){
			if(typeof options.brand === 'undefined' || options.brand.length == 0 || brand.id == parseInt(options.brand)){
				o_data[user.id][brand.id] = 0;
				o_data[user.id]['brands'][brand.id] = {
					'TOTAL': 0,
					'SHARE': 0,
					'COMMENT': 0,
					'FAVORITE': 0,
				};
			}
		});
	});

	// Contabilizando interações
	$.each(interactions,function(i,interaction){
		if(typeof options.brand === 'undefined' || options.brand.length == 0 || interaction.brand == parseInt(options.brand)){
			o_data[interaction.user]['brands'][interaction.brand][interaction.type]++;
			o_data[interaction.user]['brands'][interaction.brand]['TOTAL']++;
			o_data[interaction.user][interaction.brand]++;
			o_data[interaction.user]['total']++;
		}
	});

	// Ordenando
	o_data.sort(function(a, b) {
		return parseInt(b.total) - parseInt(a.total);
	});

	// Reduzindo para apenas o top 10
	o_data = o_data.slice(0,10);

	// Montando cabeçalho e as cores do gráfico conforme marcas escolhidas
	header = [];
	colors = [];
	header.push('Usuário');
	$.each(brands,function(i,brand){
		if(typeof options.brand === 'undefined' || options.brand.length == 0 || brand.id == parseInt(options.brand)){
			header.push(brand.name);
			colors.push({color: brand.color});
		}
	});
}

// Função executa a cada alteração de marca: filtra os dados e recarrega gráfico
function changeBrand(){
	var sel = $('#sel-brand').val();

	// Organizando os dados
	organizeData({brand:sel});

	// Recarregando gráfico
	google.charts.setOnLoadCallback(drawStacked);
}

// Carregando google charts
google.charts.load('current', {packages: ['corechart', 'bar']});

// Carregando dados
loadData();


function drawStacked() {
	// Armazena dados do gráfico
	var graph = [];

	// Inserindo cabeçalho
	graph.push(header);

	// Montando linha dos usuários
	for(var i in o_data){
		var user_row = [];
		user_row.push(o_data[i].name.first + ' ' + o_data[i].name.last);

		for(var j in o_data[i].brands){
			user_row.push(o_data[i].brands[j]['TOTAL']);
		}

		graph.push(user_row);
	}

	// Associa os dados ao gráfico
	var data = google.visualization.arrayToDataTable(graph);

	var options = {
		title: null,
		chartArea: {width: '50%'},
		isStacked: true,
		height: 600,
		hAxis: {
			title: null,
			minValue: 0,
			ticks: [2,4,6,8],
		},
		vAxis: {
			title: null,
			textStyle: {
				fontName: 'Roboto'
			},
			minTextSpacing: 0,
            showTextEvery: 1,
            slantedText: true,
		},
		legend: {
			textStyle: {
				fontName: 'Roboto',
				fontSize: 15,
			},
		},
		series: colors
  	};
	
	chart = new google.visualization.BarChart(document.getElementById('chart_div'));
	chart.draw(data, options);

	// Atribui uma função para ser disparada quando clicado no chart
	google.visualization.events.addListener(chart, 'click', selectHandler);
}

// Função dispara toda vez que é clicado no chart.
// Verifica se foi clicado em um label. 
// Se sim, exibe informações sobre a pessoa com o label clicado 
function selectHandler(e) {
	var parts = e.targetID.split('#');

	// Possuir índice 'label' indica que foi clicado em um.
    if (parts.indexOf('vAxis') >= 0 && parts.indexOf('label') >= 0) {
    	console.log(parts);
    	// Extraindo id (de o_data) da pessoa selecionada
        var id = parts[parts.indexOf('label') + 1];

        // Carrega os dados do usuário selecionado e exibe o modal
        showModal(id)
    }
}

// Carrega os dados do usuário "id" (o_data) e exibe o modal
function showModal(id){
	if(typeof id !== 'undefined'){

		// Atribuindo dados ao modal
		var user = o_data[id];

		// Avatar
		$('.avatar img').attr('src',user.picture.large);

		// Nome
		$('.info .name').text(user.name.first + ' ' + user.name.last);

		// Cidade
		$('.info .city').text(user.location.city + ' - ' + user.location.state);

		// Outras informações
		$('.other-info').html('');

		addInfo([
			['E-mail',user.email],
			['Telefone',user.phone],
			['Celular',user.cell],
			['Sexo',user.gender],
			['Nascimento',user.dob,'date'],
			['Naturalidade',user.nat],
		]);

		// Mostrando quantas interações o usuário fez na marca selecionada
		$('.footer .brand').text($('#sel-brand option:selected').text());
		$('.footer .qty').text(user.total);

		// Exibe o modal
		$('.modal').fadeIn();
	}
}

// Adiciona um ou mais dados adicionais de usuário
function addInfo(arr){
	for(var i in arr){
		var value = arr[i][1];
		
		if(arr[i].length == 3){
			switch(arr[i][2]){
				case 'date':
					value = tsToDate(value);
				break;
				// acrescentar outras formas de conversão
			}
		}

		var wrap = $('<div/>').addClass('attribute');

		$('<span/>').addClass('att-title').text(arr[i][0]).appendTo(wrap);
		$('<span/>').addClass('att-value').text(value).appendTo(wrap);

		wrap.appendTo('.other-info');
	}
}

// Converte timestamp em data dd/mm/yyyy
function tsToDate(value){
	var date = new Date(value*1000);

	var day = date.getDate();
	if(day < 10)
		day = '0' + day;

	var month = (date.getMonth() + 1);
	if(month < 10)
		month = '0' + month;

	var year = date.getFullYear()


	return day + '/' + month + '/' + year;
}