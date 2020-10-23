$('document').ready(function() {
    //
    //---------------------------------------------------------------------------------------------------------------------------------------------------//
    // Onde estou
    var ResponseURL = window.location.href;
    var domain = ResponseURL.split('/');
    var dir_local = domain[domain.length - 2];
    //
    //---------------------------------------------------------------------------------------------------------------------------------------------------//
    //
    var pagina;
    var qnt_result_pg;
    var acao;
    //
    function listaProdutos(pagina, qnt_result_pg, acao) {
        //var pesquisa = $("#pesquisa-form").serialize();
        var pesquisa = $('#pesquisa').val();
        //
        if (pagina === null || pagina === '') {
            pagina = '1';
        }
        if (qnt_result_pg === null || qnt_result_pg === '') {
            qnt_result_pg = '50';
        }
        //
        $.ajax({
                url: "./lista_produtos.php",
                type: "POST",
                dataType: "html",
                data: {
                    pagina: pagina,
                    qnt_result_pg: qnt_result_pg,
                    pesquisa: pesquisa
                },
                beforeSend: function() {
                    console.log('listaProdutos Consultando.');
                    console.log('listaProdutos Pagina.....: ' + pagina);
                    console.log('listaProdutos Resultado..: ' + qnt_result_pg);
                    console.log('listaProdutos Pesquisa...: ' + pesquisa);
                    console.log('listaProdutos Diretorio..: ' + dir_local);
                    console.log('listaProdutos Ação.......: ' + acao);
                }
            })
            .done(function(data) {
                $('#resultado-produtos').html(data);
                console.log('Consultado');
                if (acao === 'atualizar') {
                    Lobibox.notify('success', {
                        soundPath: '../packages/lobibox/sounds/',
                        soundExt: '.ogg',
                        showClass: 'zoomIn',
                        icon: true,
                        size: 'mini',
                        msg: 'Lista atualizada!',
                        sound: false,
                        position: 'bottom right',
                    });
                }
            })
            .fail(function(jqXHR, textStatus, data) {
                console.log('Falha......: ' + data);
            });
        //
    }
    //
    function listaProdutosCart(pagina, qnt_result_pg, acao) {
        //var pesquisa = $("#pesquisa-form").serialize();
        var pesquisa = $('#pesquisa').val();
        //
        if (pagina === null || pagina === '') {
            pagina = '1';
        }
        if (qnt_result_pg === null || qnt_result_pg === '') {
            qnt_result_pg = '50';
        }
        //
        $.ajax({
                url: "./lista_cart.php",
                type: "POST",
                dataType: "html",
                data: {
                    pagina: pagina,
                    qnt_result_pg: qnt_result_pg,
                    pesquisa: pesquisa
                },
                beforeSend: function() {
                    console.log('listaProdutosCart Consultando.');
                    console.log('listaProdutosCart Pagina.....: ' + pagina);
                    console.log('listaProdutosCart Resultado..: ' + qnt_result_pg);
                    console.log('listaProdutosCart Pesquisa...: ' + pesquisa);
                    console.log('listaProdutosCart Diretorio..: ' + dir_local);
                    console.log('listaProdutosCart Ação.......: ' + acao);
                }
            })
            .done(function(data) {
                $('#resultado-lista').html(data);
                console.log('Consultado');
                if (acao === 'atualizar') {
                    Lobibox.notify('success', {
                        soundPath: '../packages/lobibox/sounds/',
                        soundExt: '.ogg',
                        showClass: 'zoomIn',
                        icon: true,
                        size: 'mini',
                        msg: 'Lista atualizada!',
                        sound: false,
                        position: 'bottom right',
                    });
                }
            })
            .fail(function(jqXHR, textStatus, data) {
                console.log('Falha......: ' + data);
            });
        //
    }
    //
    function listaUnidades(pagina, qnt_result_pg, acao) {
        //var pesquisa = $("#pesquisa-form").serialize();
        var pesquisa = $('#pesquisa').val();
        //
        if (pagina === null || pagina === '') {
            pagina = '1';
        }
        if (qnt_result_pg === null || qnt_result_pg === '') {
            qnt_result_pg = '50';
        }
        //
        $.ajax({
                url: "./lista_unidades.php",
                type: "POST",
                dataType: "html",
                data: {
                    pagina: pagina,
                    qnt_result_pg: qnt_result_pg,
                    pesquisa: pesquisa
                },
                beforeSend: function() {
                    console.log('listaUnidades Consultando.');
                    console.log('listaUnidades Pagina.....: ' + pagina);
                    console.log('listaUnidades Resultado..: ' + qnt_result_pg);
                    console.log('listaUnidades Pesquisa...: ' + pesquisa);
                    console.log('listaUnidades Diretorio..: ' + dir_local);
                    console.log('listaUnidades Ação.......: ' + acao);
                }
            })
            .done(function(data) {
                $('#resultado-unidades').html(data);
                console.log('Consultado');
                if (acao === 'atualizar') {
                    Lobibox.notify('success', {
                        soundPath: '../packages/lobibox/sounds/',
                        soundExt: '.ogg',
                        showClass: 'zoomIn',
                        icon: true,
                        size: 'mini',
                        msg: 'Lista atualizada!',
                        sound: false,
                        position: 'bottom right',
                    });
                }
            })
            .fail(function(jqXHR, textStatus, data) {
                console.log('Falha......: ' + data);
            });
        //
    }
    //
    //---------------------------------------------------------------------------------------------------------------------------------------------------//
    //
    // valid email pattern
    var eregex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    jQuery.validator.addMethod("validemail", function(value, element) {
        // allow any non-whitespace characters as the host part
        return this.optional(element) || eregex.test(value);
    });
//
    jQuery.validator.addMethod("checkemail", function(email, element) {
        var Url = "../validacao/val_email.php";
        //let result = false;
        $.ajax({
            type: "POST",
            url: Url,
            data: {
                email: email
            },
            dataType: "JSON",
            dataFilter: function(data) {
                console.log(data);
                var json = JSON.parse(data);
                if (json.isError == false) {
                    console.log(json.isError + ': '+ json.isMsg);
                    result = false;
                } else {
                    console.log(json.isError + ': '+ json.isMsg);
                    result = true;
                }
            },
            async: false
        });
        console.log(result);
        return result;
    }, "Endereço de e-mail invalido!");
//
    $("#login-form").validate({
        rules: {
            email: {
                required: true,
                checkemail: true
            },
            pwd: {
                required: true
            }
        },
        messages: {
            email: {
                required: "Informe seu e-mail!",
                checkemail: "Informe um e-mail valido!"
            },
            pwd: {
                required: "Informe sua senha!"
            }
        },
        errorPlacement: function(error, element) {
            $(element).closest('.form-group').find('.help-block').html(error.html());
        },
        highlight: function(element) {
            $(element).closest('.form-control').removeClass('is-valid').addClass('is-invalid');
            $(element).closest('.custom-select').removeClass('is-valid').addClass('is-invalid');
        },
        unhighlight: function(element, errorClass, validClass) {
            $(element).closest('.form-group').find('.help-block').html('');
            $(element).closest('.form-control').removeClass('is-invalid').addClass('is-valid');
            $(element).closest('.custom-select').removeClass('is-invalid').addClass('is-valid');
        },
        submitHandler: function() {
            //event.preventDefault();
            grecaptcha.ready(function() {
                grecaptcha.execute('6LeNSbIZAAAAAHxZcXhdBfaHo41Q7Ul5qVzy4qK9', {
                    action: 'login'
                }).then(function(token) {
                    //$('#login-form').prepend('<input type="hidden" name="recaptchaResponse" value="' + token + '">');
                    //$('#login-form').prepend('<input type="hidden" name="action" value="login">');
                    var recaptchaResponse = document.getElementById('recaptchaResponse');
                    recaptchaResponse.value = token;
                    console.log('Token: ' + token);
                    //
                    var data = $("#login-form").serialize();
                    $.ajax({
                        type: 'POST',
                        url: './login.php',
                        data: data,
                        dataType: 'json',
                        beforeSend: function() {
                            $("#send_form").html('<i class="fas fa-spinner fa-spin"></i> Logando ...');
                        },
                        success: function(response) {
                            if (response.codigo == "1") {
                                $("#send_form").html('Logar');
                                $("#login-alert").css('display', 'none');
                                window.location.href = "../home/";
                            } else {
                                $("#send_form").html('Logar');
                                console.log('Menssagem: ' + response.mensagem);
                                console.log('Debug: ' + response.debug);
                                $("#mensagem").html('<center>' +
                                    '<div class="panel-body padding-top-md" >' +
                                    '<div id="login-alert" class="alert alert-' + response.alerta + ' col-sm-6">' +
                                    response.iconem + '&#32;' + response.mensagem +
                                    '</div>' +
                                    '</div>' +
                                    '</center>');
                                $("#login-alert").css('display', 'block');
                                window.scrollTo(0, 0);
                            }
                        }
                    });
                });
            });

        }
    });
    //
    //---------------------------------------------------------------------------------------------------------------------------------------------------//
    //
    // https://github.com/elboletaire/password-strength-meter
    // https://elboletaire.github.io/password-strength-meter/
    // https://adri-sorribas.github.io/passtrength/
    //
    $("#show_login_password i").on('click', function(event) {
        event.preventDefault();
        if ($("#show_login_password input").attr("type") === "text") {
            $("#show_login_password input").attr('type', 'password');
            $("#show_login_password i").addClass("fa-eye-slash");
            $("#show_login_password i").removeClass("fa-eye");

        } else if ($("#show_login_password input").attr("type") === "password") {
            $("#show_login_password input").attr('type', 'text');
            $("#show_login_password i").removeClass("fa-eye-slash");
            $("#show_login_password i").addClass("fa-eye");
        }
    });
    //
    // Data Tables
    //---------------------------------------------------------------------------------------------------------------------------------------------------//
    //
    var org_produtos = $('.org_produtos').DataTable({
        dom: 'f',
        lengthMenu: [
            [50, 100, 200, -1],
            [50, 100, 200, "All"]
        ],
        fixedHeader: true,
        order: [
            [0, 'asc']
        ],
        language: {
            lengthMenu: "Exibir _MENU_ registros por pagina",
            zeroRecords: "Nada encontrado",
            info: "Mostrando pagina _PAGE_ de _PAGES_",
            infoEmpty: "Nenhum registro disponível",
            infoFiltered: "(filtrado de _MAX_ total de registros)",
            decimal: ",",
            thousands: ".",
            loadingRecords: "Carregando...",
            processing: "Processando...",
            search: "Pesquisar:",
            paginate: {
                first: "Primeira",
                last: "Última",
                next: "Próxima",
                previous: "Anterior"
            }
        }
    });
    //
    //---------------------------------------------------------------------------------------------------------------------------------------------------//
    //
    var org_usuarios = $('.org_usuarios').DataTable({
        lengthMenu: [
            [50, 100, 200, -1],
            [50, 100, 200, "All"]
        ],
        fixedHeader: true,
        order: [
            [0, 'asc']
        ],
        language: {
            lengthMenu: "Exibir _MENU_ registros por pagina",
            zeroRecords: "Nada encontrado",
            info: "Mostrando pagina _PAGE_ de _PAGES_",
            infoEmpty: "Nenhum registro disponível",
            infoFiltered: "(filtrado de _MAX_ total de registros)",
            decimal: ",",
            thousands: ".",
            loadingRecords: "Carregando...",
            processing: "Processando...",
            search: "Pesquisar:",
            paginate: {
                first: "Primeira",
                last: "Última",
                next: "Próxima",
                previous: "Anterior"
            }
        }
    });
    //
    //---------------------------------------------------------------------------------------------------------------------------------------------------//
    //
    $(document).on("click", ".pagina", function(evt) {
        evt.preventDefault();
        var pagina = $(this).attr("data-pagina");
        var qnt_result_pg = $(this).attr("data-qnt_result_pg");
        console.log('Pagina: ' + pagina + ' / Qnt: ' + qnt_result_pg);
        //
        if (dir_local === 'produtos') {
            listaProdutos(pagina, qnt_result_pg, null);
        }
        if (dir_local === 'unidades') {
            listaUnidades(pagina, qnt_result_pg, null);
        }
        if (dir_local === 'lista') {
            listaProdutosCart(pagina, qnt_result_pg, null);
        }
    });
    //
    //---------------------------------------------------------------------------------------------------------------------------------------------------//
    //
    $(document).on("click", ".atualizar-produto", function(evt) {
        evt.preventDefault();
        $('#pesquisa').val('');
        listaProdutos('1', '50', 'atualizar');
    });
    //
    $(document).on("click", ".atualizar-unidades", function(evt) {
        evt.preventDefault();
        $('#pesquisa').val('');
        listaUnidades('1', '50', 'atualizar');
    });
    //
    $(document).on("click", ".atualizar-lista", function(evt) {
        evt.preventDefault();
        $('#pesquisa').val('');
        listaProdutosCart('1', '50', 'atualizar');
    });
    //
    //---------------------------------------------------------------------------------------------------------------------------------------------------//
    //
    $("#pesquisa").keyup(function(evt) {
        evt.preventDefault();
        if (dir_local === 'produtos') {
            listaProdutos('1', '50', null);
        }
        if (dir_local === 'unidades') {
            listaUnidades('1', '50', null);
        }
        if (dir_local === 'lista') {
            listaProdutosCart('1', '50', null);
        }
    });
    //
    if (dir_local === 'produtos') {
        listaProdutos('1', '50', null);
    }
    if (dir_local === 'unidades') {
        listaUnidades('1', '50', null);
    }
    if (dir_local === 'lista') {
        listaProdutosCart('1', '50', null);
    }
    //
    //---------------------------------------------------------------------------------------------------------------------------------------------------//
    //
    //
    $(document).on("click", ".para-excel", function(evt) {
        $('#custon-lista').tableExport({
            type: 'excel',
            ignoreColumn: [3],
            fileName: 'listademateial'
        });
    });
    //
    $(document).on("click", ".para-pdf", function(evt) {
        $('#custon-lista').tableExport({
            type: 'pdf',
            ignoreColumn: [3],
            fileName: 'listademateial'
        });
    });
    //
    $(document).on("click", ".para-png", function(evt) {
        $('#custon-lista').tableExport({
            type: 'png',
            fileName: 'listademateial'
        });
    });
    //
    $(document).on("click", ".inc.button", function(evt) {
    	var idprod = $(this).attr("data-id");
        var $this = $(this),
            $input = $this.prev('input'),
            $parent = $input.closest('span'),
            newValue = parseInt($input.val()) + 1;
        $parent.find('.inc').addClass('a' + newValue);
        $input.val(newValue);
        var incrementVar;
        incrementVar += newValue;
        console.log("Qtn: "+newValue);
        console.log("ID: "+idprod);
        $("#"+idprod).html(newValue);
    });
    //
    $(document).on("click", ".dec.button", function(evt) {
    	var idprod = $(this).attr("data-id");
        var $this = $(this),
            $input = $this.next('input'),
            $parent = $input.closest('span'),
            oldValue = parseInt($input.val());
        // Don't allow decrementing below zero
        if (oldValue > 1) {
            var newValue = parseInt($input.val()) - 1;
        } else {
            newValue = 1;
        }
        $parent.find('.inc').addClass('a' + newValue);
        $input.val(newValue);
        var incrementVar;
        incrementVar += newValue;
        console.log("Qtn: "+newValue);
        console.log("ID: "+idprod);
        $("#"+idprod).html(newValue);
    });
    //
    //---------------------------------------------------------------------------------------------------------------------------------------------------//
    //

    //
    //---------------------------------------------------------------------------------------------------------------------------------------------------//
    //
});