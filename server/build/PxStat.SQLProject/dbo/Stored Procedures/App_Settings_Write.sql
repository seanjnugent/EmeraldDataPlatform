﻿
CREATE
	

 PROCEDURE [dbo].[App_Settings_Write] @appversion DECIMAL(10, 2)
	,@appkey VARCHAR(200)
	,@appvalue VARCHAR(MAX)
	,@appdescription VARCHAR(MAX)
	,@appsensitivevalue BIT = NULL
	,@userName NVARCHAR(256)
AS
BEGIN
	SET NOCOUNT ON;

	DECLARE @APPID AS INT;
	DECLARE @newkey AS INT;

	SET @APPID = (
			SELECT MAX(TM_APP_SETTING_CONFIG_VERSION.ASV_ID)
			FROM TM_APP_SETTING_CONFIG_VERSION
			INNER JOIN TS_CONFIG_SETTING_TYPE ON TS_CONFIG_SETTING_TYPE.CST_ID = TM_APP_SETTING_CONFIG_VERSION.ASV_CST_ID
			WHERE (TS_CONFIG_SETTING_TYPE.CST_CODE = 'APP')
			);

	DECLARE @DtgId AS INT = NULL;

	EXECUTE @DtgId = Security_Auditing_Create @userName;

	IF @DtgId IS NULL
		OR @DtgId = 0
	BEGIN
		RAISERROR (
				'SP: Security_Auditing_Create has failed!'
				,16
				,1
				);

		RETURN 0;
	END

	SET @newkey = (
			SELECT count(*)
			FROM TS_APP_SETTING
			WHERE APP_KEY = @appkey
				AND APP_ASV_ID = (
					SELECT MAX(ASV_ID)
					FROM TM_APP_SETTING_CONFIG_VERSION
					WHERE ASV_VERSION = @appversion
					)
			);

	IF @newkey = 0
	BEGIN
		INSERT INTO TS_APP_SETTING
		VALUES (
			@APPID
			,@appkey
			,@appvalue
			,@appdescription
			,COALESCE(@appsensitivevalue, 0)
			);

		INSERT INTO TS_APP_SETTING
		SELECT @APPID
			,APP_KEY
			,APP_VALUE
			,APP_DESCRIPTION
			,APP_SENSITIVE_VALUE
		FROM TS_APP_SETTING
		WHERE APP_ASV_ID = (
				SELECT DISTINCT ASV_ID
				FROM TM_APP_SETTING_CONFIG_VERSION
				WHERE ASV_VERSION = @appversion
					AND ASV_CST_ID = 2
				);
	END
	ELSE
	BEGIN
		INSERT INTO TS_APP_SETTING
		VALUES (
			@APPID
			,@appkey
			,@appvalue
			,@appdescription
			,COALESCE(@appsensitivevalue, 0)
			);

		INSERT INTO TS_APP_SETTING
		SELECT @APPID
			,APP_KEY
			,APP_VALUE
			,APP_DESCRIPTION
			,APP_SENSITIVE_VALUE
		FROM TS_APP_SETTING
		WHERE APP_ASV_ID = (
				SELECT DISTINCT ASV_ID
				FROM TM_APP_SETTING_CONFIG_VERSION
				WHERE ASV_VERSION = @appversion
					AND ASV_CST_ID = 2
				)
			AND APP_KEY <> @appkey;
	END
END
