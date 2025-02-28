﻿
-- =============================================
-- Author:		Neil O'Keeffe
-- Create date: 07/02/2020
-- Description:	Returns a list of individual Matrix codes that are associated with a given group
-- EXEC Data_Matrix_ReadByGroup '2016PCP3OY','en','en'
-- =============================================
CREATE
	

 PROCEDURE Data_Matrix_ReadByGroup @GrpCode NVARCHAR(32)
	,@LngIsoCode CHAR(2)
	,@LngIsoCodeDefault CHAR(2)
AS
BEGIN
	SET NOCOUNT ON;

	DECLARE @IsLive BIT
	DECLARE @IsNotLive BIT

	SET @IsLive = 1
	SET @IsNotLive = 0

	DECLARE @LngId INT
	DECLARE @LngDefaultId INT

	SET @LngId = (
			SELECT LNG_ID
			FROM TS_LANGUAGE
			WHERE LNG_ISO_CODE = @LngIsoCode
				AND LNG_DELETE_FLAG = 0
			)
	SET @LngDefaultId = (
			SELECT LNG_ID
			FROM TS_LANGUAGE
			WHERE LNG_ISO_CODE = @LngIsoCodeDefault
				AND LNG_DELETE_FLAG = 0
			)

	SELECT DISTINCT mtr.MTR_CODE MtrCode
		,max(coalesce(mtrLng.MTR_TITLE, mtr.MTR_TITLE)) MtrTitle -- in case there's a variable spelling of the matrix title, we choose only the first one thus avoiding MtrCode duplicates
	FROM TD_MATRIX mtr
	LEFT JOIN (
		SELECT MTR_CODE
			,MTR_TITLE
			,MTR_RLS_ID
		FROM TD_MATRIX
		WHERE MTR_DELETE_FLAG = 0
			AND MTR_LNG_ID = @LngId
		) mtrLng
		ON mtr.MTR_CODE = mtrLng.MTR_CODE
			AND MTR.MTR_RLS_ID = mtrLng.MTR_RLS_ID
	INNER JOIN TD_RELEASE
		ON mtr.MTR_RLS_ID = RLS_ID
			AND MTR_DELETE_FLAG = 0
			AND RLS_DELETE_FLAG = 0
	INNER JOIN TD_GROUP
		ON RLS_GRP_ID = GRP_ID
			AND GRP_CODE = @GrpCode
			AND GRP_DELETE_FLAG = 0
	LEFT JOIN VW_RELEASE_LIVE_NOW
		ON MTR_ID = VRN_MTR_ID
	GROUP BY mtr.MTR_CODE
	ORDER BY mtr.MTR_CODE
END
