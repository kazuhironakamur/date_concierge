$(function() {

    let URL = "https://i5iz16898f.execute-api.us-east-2.amazonaws.com/default/date_concierge";
    
    // スポットの編集フォームを表示する
    function edit_spot(_event, _this) {
        console.log('edit spot.');
        console.log($(_this).parents('tr').attr('id'));

        tr = $(_this).parents('tr');
        name_td = $(tr).children('.name')[0];
        $(name_td).children('span').addClass('d-none');
        $(name_td).children('input').removeClass('d-none');
    };

    // スポットの削除を行う
    function delete_spot(_event, _this) {
        let spot_id = $(_this).parents('tr').attr('id');
        console.log('delete spot: ' + spot_id);

        let data = {
            spot_id: spot_id
        };

        // DBから削除
        $.ajax({
            url: URL,
            type: "DELETE",
            dataType: "json",
            data: JSON.stringify(data),
            contentType: 'application/json',
            error: function(xhr, status, error) {
                console.log('ERROR!');
            },
            success: function(res) {
                console.log('SUCCESS!');
            }
        });
        
        // HTML上から削除
        $(_this).parents('tr').remove();

        return true;
    };

    $("#replan").click(function() {
        $("#replan").attr("disabled", "disabled");

        $.ajax({
            type: "GET",
            url: URL + '/plan', 
            dataType: "json",
            error: function() {
                console.log('ERROR!');
                $("#replan").removeAttr("disabled");
            },
            success: function(res) {
                console.log('SUCCESS!');
                console.log(res);

                $('#main_plan').val(res['main']['name']);
                $('#lunch_plan').val(res['lunch']['name']);
                $('#dinner_plan').val(res['dinner']['name']);
                $('#tea_plan').val(res['tea']['name']);
                $('#alcohol_plan').val(res['alcohol']['name']);
                
                $("#replan").removeAttr("disabled");

            }
        });
    });

    $("#new_spot_id").focusout(function(){
        console.log('new_spot_id focusout');
    });

    $('#new_spot').click(function(){
        var data = {
            spot_id:  $('#new_spot_id').val(),
            genre_id: $('#new_spot_genre').val(),
            name:     $('#new_spot_name').val()
        };
        
        console.log(data);

        $.ajax({
            url: URL,
            type: "POST",
            dataType: "json",
            data: JSON.stringify(data),
            contentType: 'application/json',
            error: function(xhr, status, error) {
                var res = $.parseJSON(xhr.responseText);
                console.log(res.message);
                $('#new_spot_alert').text(res.message);
                $('#new_spot_alert').removeClass('d-none');
            },
            success: function(res) {
                console.log('SUCCESS!');
                console.log(res);
                $('#new_spot_alert').text('新しいスポットを追加しました。');
                $('#new_spot_alert').removeClass('d-none');
            }
        });
    });

    $('#search_spot').click(function() {
        console.log('search spot.');

        let genre_id = $('#search_spot_genre').val()
        let filter = $('#search_spot_filter').val()
        console.log({'genre_id': genre_id, 'filter': filter})

        $.ajax({
            type: "GET",
            url: URL + '?genre_id=' + genre_id + '&filter=' + filter, 
            dataType: "json",
            error: function() {
                console.log('ERROR!');
            },
            success: function(res) {
                console.table(res.Items);
                $('#spot_table tbody').empty();

                let spots_html = res.Items.reduce(function(ret, item) {
                    return ret += '\
                        <tr id="' + item.spot_id + '">\
                            <td class="spot_id">' + item.spot_id + '</td>\
                            <td class="name">\
                                <span>' + item.name + '</span>\
                                <input type="text" class="form-control d-none" value="' + item.name + '">\
                                <input type="button" class="btn btn-primary d-none" value="登録">\
                            </td>\
                            <td class="actions">\
                                <input id="edit_spot" class="btn btn-primary" type="button" value="編集">\
                                <input id="delete_spot" class="btn btn-error" type="button" value="削除">\
                            </td>\
                        </tr>'
                }, '');

                $('#spot_table tbody').append(spots_html);

                //------------------------------------------------
                // 追加したボタンをeventバインド処理
                //------------------------------------------------
                // スポット編集イベント
                $(document).on("click", "#edit_spot", function(event) {
                    edit_spot(event, this);
                });

                // スポット登録イベント
                $(document).on("click", "#modify_spot", function(event) {
                    modify_spot(event, this);
                });

                // スポット削除イベント
                $(document).on("click", "#delete_spot", function(event) {
                    delete_spot(event, this);
                });
            }
        });
    });
});