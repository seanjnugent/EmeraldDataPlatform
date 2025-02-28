/*******************************************************************************
Custom JS application specific
*******************************************************************************/
$(document).ready(function () {
    // Entity with restricted access
    app.navigation.access.check(app.config.build.update.moderator ? [C_APP_PRIVILEGE_MODERATOR, C_APP_PRIVILEGE_POWER_USER] : [C_APP_PRIVILEGE_POWER_USER]);

    app.navigation.setLayout(false);
    app.navigation.setBreadcrumb([[app.label.static["build"]], [app.label.static["update"]]]);
    app.navigation.setMetaDescription();
    app.navigation.setTitle(app.label.static["build"] + " - " + app.label.static["update"]);
    app.navigation.setState("#nav-link-nav-link-update");

    // Get GoTo params
    app.build.update.goTo.fileImport = api.content.getParam("fileImport");

    $("#modal-entity").empty();
    api.content.load("#modal-entity", "entity/build/update/index.modal.html", null, true);
    api.content.load("#modal-entity", "entity/build/map/index.modal.html", null, true);
    api.content.load("#modal-entity", "entity/build/geomap/index.preview.modal.html", null, true);

    $("#build-update-upload-text-tab-content").find("[name=text-content]").once("keyup", function () {
        if ($(this).val().length) {
            $("#build-update-upload-text-tab-content").find("[name=parse-source-file]").prop("disabled", false);
        }
        else {
            $("#build-update-upload-text-tab-content").find("[name=parse-source-file]").prop("disabled", true);
        }
    });

    if (app.build.update.goTo.fileImport) {
        $("#build-update-upload-text-tab").tab('show');
        $("#build-update-upload-text-tab-content").find('[name="text-content"]').val(app.build.update.goTo.fileImport).keyup();
        app.build.update.upload.getTextInput();
    }

    $("#build-update-upload-text-tab-content").find("[name=parse-source-file]").once("click", app.build.update.upload.getTextInput);

    $("#build-update-upload-text-tab-content").find("[name=import-text-reset]").once("click", function () {
        api.modal.confirm(app.label.static["reset-page"], function () {
            $("#build-update-upload-text-tab-content").find("[name=text-content]").prop("disabled", false);
            $("#build-update-upload-text-tab-content").find("[name=text-content]").val("");
            $("#build-update-upload-text-tab-content").find("[name=parse-source-file]").prop("disabled", true);
            $("#build-update-dimensions").hide();
        })
    });

    app.build.update.search.ajax.readMatrixList();

    // Set the max file-size in the Upload box
    $("[name=upload-file-max-size]").html(app.library.utility.formatNumber(Math.ceil(app.config.transfer.threshold.hard / 1024 / 1024)) + " MB").show();
    //Initiate dragndrop file.
    api.plugin.dragndrop.initiate(document, window);

    app.build.update.validate.matrixProperty();

    app.build.update.ajax.readFormat();
    app.build.update.ajax.readFrequency();
    app.build.update.ajax.readCopyright();

    //Bind the preview button
    $("#build-update-upload-file-tab-content").find("[name=file-data-view]").once("click", function () {
        if (app.build.update.upload.file.content.source.size > app.config.transfer.threshold.soft) {
            api.modal.confirm(app.library.html.parseDynamicLabel("confirm-preview", [app.library.utility.formatNumber(Math.ceil(app.build.update.upload.file.content.source.size / 1024)) + " KB"]),
                app.build.update.upload.previewSource)
        }
        else {
            // Preview file content
            app.build.update.upload.previewSource();
        }
    });

    //bind the download template button
    $("#build-update-matrix-data").find("[name=download-data-template]").once("click", function () {
        if (app.build.update.rlsCode) {
            app.build.update.search.ajax.downloadCsvTemplate();
        }
        else {
            app.build.update.upload.FrqCode = $("#build-update-properties [name=frequency-code]").val();
            app.build.update.upload.FrqValue = $("#build-update-dimension-nav-collapse-properties-" + app.config.language.iso.code + " [name=frequency-value]").val();

            app.build.update.upload.validate.ajax.read({ "callback": "app.build.update.upload.validate.callback.downloadDataTemplate", "unitsPerSecond": app.config.transfer.unitsPerSecond["PxStat.Build.Build_API.ReadTemplate"] })
        }
    });


    //Download CSV Data button
    $("#build-update-matrix-data").find("[name=download-csv-data]").once("click", function () {
        if (!app.build.update.isPeriodsDimensionsValid()) {
            api.modal.error(app.label.static["build-update-period-error"]);
            return;
        }
        app.build.update.downloadCsvModal();
    });


    //Bind the reset button
    $("#build-update-upload-file-tab-content").find("[name=upload-source-file-reset]").once("click", function () {
        api.modal.confirm(
            app.label.static["reset-page"],
            app.build.update.upload.reset
        );
    });

    //bind data reset button
    $("#build-update-matrix-data").find("[name=reset-data]").once("click", app.build.update.callback.resetData);

    //bind data preview button
    $("#build-update-matrix-data").find("[name=preview-data]").once("click", function () {
        if (app.build.update.upload.file.content.data.size > app.config.transfer.threshold.soft) {
            api.modal.confirm(app.library.html.parseDynamicLabel("confirm-preview", [app.library.utility.formatNumber(Math.ceil(app.build.update.upload.file.content.data.size / 1024)) + " KB"]),
                app.build.update.callback.previewData)
        }
        else {
            // Preview file content
            app.build.update.callback.previewData();
        }
    });

    //Bind the reset button
    $("#build-update-matrix-dimensions").find("[name=reset]").once("click", function () {
        api.modal.confirm(
            app.label.static["update-reset-dimension"],
            function () {
                //reload all content into page
                api.content.load("#body", "entity/build/update/index.html");
            }
            // app.build.update.upload.drawProperties
        );
    });

    //Bind the periods upload reset button
    $("#build-update-new-periods").find("[name=upload-reset-periods]").once("click", app.build.update.resetUpoadPeriod);

    //Bind the upload button
    $("#build-update-upload-file-tab-content").find("[name=upload-source-file]").once("click", function () {
        app.build.update.upload.validate.ajax.read({ "callback": "app.build.update.upload.validate.callback.uploadSource", "unitsPerSecond": app.config.transfer.unitsPerSecond["PxStat.Build.Build_API.Read"] });
    });

    //matrix lookup
    $("#build-update-properties").find("[name=button-matrix-lookup]").once("click", app.build.update.upload.ajax.matrixLookup);

    //Submit changes
    $("#build-update-matrix-dimensions").find("[name=update]").once("click", app.build.update.updateOutput);

    //Add periods manually
    $("#build-update-new-periods").find("[name=manual-submit-periods]").once("click", app.build.update.addManualPeriod);

    //Add periods upload
    $("#build-update-new-periods").find("[name=upload-submit-periods]").once("click", app.build.update.addUploadPeriod);

    //clean modal after closing
    $('#build-update-new-periods').on('hide.bs.modal', function (e) {
        $(this).find("[name=build-update-upload-periods-file]").val("");
        $(this).find("[name=file-name]").empty().hide();
        $(this).find("[name=file-tip]").show();
        $(this).find("[name=upload-submit-periods]").prop("disabled", true);

        $('#build-update-manual-periods').find("[name=errors-card]").hide();
        $('#build-update-manual-periods').find("[name=errors]").empty();

        $('#build-update-upload-periods').find("[name=errors-card]").hide();
        $('#build-update-upload-periods').find("[name=errors]").empty();

    });

    //set tabs when showing modal
    $('#build-update-new-periods').on('show.bs.modal', function (e) {
        $("#build-update-manual-periods").addClass("show active");
        $("#build-update-upload-periods").removeClass("show active");
        $(this).find("[name=manual-tab]").addClass("active show").attr("aria-selected", "true");
        $(this).find("[name=upload-tab]").removeClass("active show").attr("aria-selected", "false");
    });

    $('#build-update-modal-frequency').on('show.bs.modal', function () {
        app.build.update.validate.frequencyModal();
    });

    $("#build-update-download-csv-file [name=labels]").bootstrapToggle("destroy").bootstrapToggle({
        onlabel: app.label.static["true"],
        offlabel: app.label.static["false"],
        onstyle: "success text-light",
        offstyle: "warning text-dark",
        height: 38,
        width: C_APP_TOGGLE_LENGTH
    });

    $("#build-update-modal-select-language").find("[name=btn-submit]").once("click", function () {
        $("#build-update-modal-select-language input:checkbox[name=language-checkbox]:checked").each(function () {
            app.build.update.search.selectedLanguages.push($(this).val());
        });;
        app.build.update.search.ajax.loadRelease();
    });
    //run bootstrap toggle to show/hide toggle button
    app.library.bootstrap.getBreakPoint();
    // Translate labels language (Last to run)
    app.library.html.parseStaticLabel();
});
